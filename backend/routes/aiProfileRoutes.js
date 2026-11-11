
const express = require('express');

const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');
const Program = require('../models/Program');

const {
  authenticate,
  authenticateMentee
} = require('../middleware/authMentor');

const {
  uniqueStrings,
  inferInterests,
  buildAvatarUrl,
  buildMenteeBadges,
  buildMenteeFallback,
  generateNarrative
} = require('../services/profileAI');

const router = express.Router();


// --------------------------------------------------
// Helper: Get resource ID
// --------------------------------------------------

function getResourceId(entry) {
  const resource = entry?.resource;

  if (!resource) return null;

  return String(resource._id || resource);
}


// --------------------------------------------------
// Helper: Validate and normalize interests
// --------------------------------------------------

function validateInterests(value) {
  if (!Array.isArray(value)) {
    return {
      error: 'Interests must be an array of strings'
    };
  }

  if (value.some(item => typeof item !== 'string')) {
    return {
      error: 'Every interest must be a string'
    };
  }

  const cleaned = value.map(item => item.trim());

  if (cleaned.some(item => item.length > 40)) {
    return {
      error: 'Each interest must contain at most 40 characters'
    };
  }

  // Remove empty and duplicate interests.
  const interests = [
    ...new Map(
      cleaned
        .filter(Boolean)
        .map(item => [item.toLowerCase(), item])
    ).values()
  ];

  if (interests.length > 12) {
    return {
      error: 'You can select at most 12 interests'
    };
  }

  return { interests };
}


// --------------------------------------------------
// Helper: Calculate mentee rank
// --------------------------------------------------

async function calculateMenteeRank(menteeId) {
  const current = await Mentee.findById(menteeId)
    .select('completedResources streak lastActiveDate')
    .lean();

  if (!current) return null;

  const currentScore = (current.completedResources || [])
    .reduce(
      (sum, item) => sum + (Number(item.score) || 0),
      0
    );

  const currentStreak = current.streak || 0;

  const currentLastActive =
    current.lastActiveDate || new Date(0);

  const better = await Mentee.aggregate([
    {
      $project: {
        streak: {
          $ifNull: ['$streak', 0]
        },

        lastActiveDate: {
          $ifNull: ['$lastActiveDate', new Date(0)]
        },

        totalScore: {
          $sum: {
            $map: {
              input: {
                $ifNull: ['$completedResources', []]
              },
              as: 'entry',
              in: {
                $ifNull: ['$$entry.score', 0]
              }
            }
          }
        }
      }
    },
    {
      $match: {
        $or: [
          {
            totalScore: {
              $gt: currentScore
            }
          },
          {
            totalScore: currentScore,
            streak: {
              $gt: currentStreak
            }
          },
          {
            totalScore: currentScore,
            streak: currentStreak,
            lastActiveDate: {
              $gt: currentLastActive
            }
          },
          {
            totalScore: currentScore,
            streak: currentStreak,
            lastActiveDate: currentLastActive,
            _id: {
              $lt: current._id
            }
          }
        ]
      }
    },
    {
      $count: 'count'
    }
  ]);

  return (better[0]?.count || 0) + 1;
}


// --------------------------------------------------
// GET Mentee AI Profile
// GET /api/m/ai-profile
// --------------------------------------------------

router.get(
  '/m/ai-profile',
  authenticateMentee,
  async (req, res) => {
    try {
      const mentee = await Mentee.findById(req.mentee._id)
        .select('-password')
        .populate({
          path: 'programs',
          populate: {
            path: 'resources',
            model: 'Resource'
          }
        })
        .populate({
          path: 'completedResources.resource',
          model: 'Resource'
        });

      if (!mentee) {
        return res.status(404).json({
          error: 'Mentee profile not found'
        });
      }

      // Create a map for completed resources.
      const completionByResource = new Map();

      (mentee.completedResources || []).forEach(entry => {
        const id = getResourceId(entry);

        if (id) {
          completionByResource.set(id, entry);
        }
      });

      // Add completion status to each program resource.
      const programs = (mentee.programs || [])
        .filter(Boolean)
        .map(program => {
          const resources = (program.resources || [])
            .filter(Boolean)
            .map(resource => {
              const completion = completionByResource.get(
                String(resource._id)
              );

              return {
                ...resource.toObject(),
                completed: Boolean(completion),
                score: completion
                  ? Number(completion.score) || 0
                  : null,
                completedOn: completion?.completedOn || null
              };
            });

          return {
            ...program.toObject(),
            resources
          };
        });

      const resources = programs.flatMap(
        program => program.resources || []
      );

      const completedResources = resources.filter(
        resource => resource.completed
      );

      const pendingResources = resources.filter(
        resource => !resource.completed
      );

      const completed = completedResources.length;
      const total = resources.length;

      const progress = total
        ? Math.round((completed / total) * 100)
        : 0;

      const totalScore = (
        mentee.completedResources || []
      ).reduce(
        (sum, entry) => sum + (Number(entry.score) || 0),
        0
      );

      const rank = await calculateMenteeRank(mentee._id);

      const streak = Number(mentee.streak) || 0;

      const interestTags = inferInterests(
        programs,
        resources,
        mentee.interests || []
      );

      const skillBadges = buildMenteeBadges({
        completed,
        completedResources,
        streak,
        rank,
        progress,
        total
      });

      const fallback = buildMenteeFallback({
        name: mentee.name,
        completed,
        total,
        progress,
        totalScore,
        streak,
        rank,
        pendingResources,
        interestTags
      });

      // Send aggregate learning metrics to the AI provider.
      const narrative = await generateNarrative(
        {
          role: 'mentee',
          metrics: {
            completedResources: completed,
            assignedResources: total,
            progressPercent: progress,
            totalScore,
            learningStreak: streak,
            leaderboardRank: rank
          },
          interestTags,
          completedResourceTypes: uniqueStrings(
            completedResources.map(item => item.type)
          ),
          pendingResourceTypes: uniqueStrings(
            pendingResources.map(item => item.type)
          )
        },
        fallback
      );

      const avatarSeed = `${mentee._id}-${interestTags.join('-')}`;

      res.set('Cache-Control', 'no-store');

      return res.status(200).json({
        name: mentee.name,
        email: mentee.email,
        enrollmentNumber: mentee.enrollmentNumber,
        programs,
        streak,
        totalScore,
        rank,

        aiProfile: {
          avatarUrl: buildAvatarUrl(avatarSeed),
          interestTags,
          skillBadges,
          performanceSummary: narrative.performanceSummary,
          recommendations: narrative.recommendations,
          generationMode: narrative.generationMode,
          generatedAt: new Date().toISOString(),

          metrics: {
            completed,
            total,
            progress,
            pending: pendingResources.length
          }
        }
      });

    } catch (error) {
      console.error('Mentee AI profile error:', error.message);

      return res.status(500).json({
        error: 'Unable to generate the learning profile'
      });
    }
  }
);


// --------------------------------------------------
// Update Mentee Interests
// PUT /api/m/ai-profile/interests
// --------------------------------------------------

router.put(
  '/m/ai-profile/interests',
  authenticateMentee,
  async (req, res) => {
    const result = validateInterests(req.body?.interests);

    if (result.error) {
      return res.status(400).json({
        error: result.error
      });
    }

    try {
      const mentee = await Mentee.findByIdAndUpdate(
        req.mentee._id,
        {
          $set: {
            interests: result.interests
          }
        },
        {
          new: true,
          runValidators: true
        }
      ).select('interests');

      if (!mentee) {
        return res.status(404).json({
          error: 'Mentee not found'
        });
      }

      return res.status(200).json({
        message: 'Interests updated successfully',
        interests: mentee.interests
      });

    } catch (error) {
      console.error('Update mentee interests error:', error.message);

      return res.status(500).json({
        error: 'Unable to update interests'
      });
    }
  }
);


// --------------------------------------------------
// GET Mentor AI Profile
// GET /api/mentor/ai-profile
// --------------------------------------------------

router.get(
  '/mentor/ai-profile',
  authenticate,
  async (req, res) => {
    try {
      const mentor = await Mentor.findById(req.mentor._id)
        .select('-password')
        .lean();

      if (!mentor) {
        return res.status(404).json({
          error: 'Mentor profile not found'
        });
      }

      const programs = await Program.find({
        _id: {
          $in: mentor.programs || []
        }
      })
        .populate('resources')
        .lean();

      const programIds = programs.map(
        program => program._id
      );

      const programIdSet = new Set(
        programIds.map(id => id.toString())
      );

      // Only retrieve mentees enrolled in the mentor's programs.
      const mentees = await Mentee.find({
        programs: {
          $in: programIds
        }
      })
        .select('programs completedResources streak totalScore')
        .populate({
          path: 'completedResources.resource',
          select: 'title type program'
        })
        .lean();

      const resources = programs.flatMap(
        program => program.resources || []
      );

      // Count assigned resources per mentee.
      // A mentee may belong to only some of the mentor's programs.
      const assignedResourceCount = mentees.reduce(
        (count, mentee) => {
          const menteeProgramIds = new Set(
            (mentee.programs || []).map(
              id => id.toString()
            )
          );

          const menteeAssignedResources = programs
            .filter(program =>
              menteeProgramIds.has(program._id.toString())
            )
            .reduce(
              (sum, program) =>
                sum + (program.resources || []).length,
              0
            );

          return count + menteeAssignedResources;
        },
        0
      );

      // Count only completed entries belonging to the mentor's programs.
      const completedEntries = mentees
        .flatMap(mentee => mentee.completedResources || [])
        .filter(entry => {
          const resource = entry.resource;

          return (
            resource &&
            resource.program &&
            programIdSet.has(resource.program.toString())
          );
        });

      const completedCount = completedEntries.length;

      const projectReviewsPending = completedEntries.filter(
        entry =>
          entry.resource?.type === 'project' &&
          entry.verified !== true
      ).length;

      const interestTags = inferInterests(
        programs,
        resources,
        mentor.interests || []
      );

      // Generate mentor badges.
      const badges = [];

      if (programs.length) {
        badges.push({
          icon: '🎓',
          title: 'Programme Mentor',
          description: `Guiding ${programs.length} programme(s)`
        });
      }

      if (mentees.length >= 5) {
        badges.push({
          icon: '🌱',
          title: 'Community Builder',
          description: `Supporting ${mentees.length} mentees`
        });
      }

      if (resources.length >= 5) {
        badges.push({
          icon: '📚',
          title: 'Resource Creator',
          description: `Published ${resources.length} learning resources`
        });
      }

      // Fallback narrative if AI generation is unavailable.
      const fallback = {
        performanceSummary:
          `You are guiding ${mentees.length} mentees across ` +
          `${programs.length} programmes, with ${resources.length} ` +
          `learning resources published. ${projectReviewsPending} ` +
          `project submission(s) are awaiting review.`,

        recommendations: [
          ...(projectReviewsPending
            ? [{
                icon: '📝',
                title: 'Review pending projects',
                description:
                  `${projectReviewsPending} project submission(s) ` +
                  'are waiting for evaluation and feedback.'
              }]
            : []),

          ...(programs.length
            ? [{
                icon: '📊',
                title: 'Track cohort progress',
                description:
                  'Review completion patterns across your programmes ' +
                  'and identify mentees who may need support.'
              }]
            : [{
                icon: '🎯',
                title: 'Set up your first programme',
                description:
                  'Create a mentorship programme and add learning ' +
                  'resources to start guiding a cohort.'
              }])
        ].slice(0, 3)
      };

      const narrative = await generateNarrative(
        {
          role: 'mentor',

          metrics: {
            programmes: programs.length,
            mentees: mentees.length,
            publishedResources: resources.length,
            completedResourceEntries: completedCount,
            pendingProjectReviews: projectReviewsPending
          },

          interestTags
        },
        fallback
      );

      res.set('Cache-Control', 'no-store');

      return res.status(200).json({
        name: mentor.name,
        email: mentor.email,

        programs: programs.map(program => ({
          _id: program._id,
          name: program.name,
          resourceCount: (program.resources || []).length
        })),

        metrics: {
          programmes: programs.length,
          mentees: mentees.length,
          resources: resources.length,
          completedResourceEntries: completedCount,
          pendingProjectReviews: projectReviewsPending,
          assignedResourceCount
        },

        aiProfile: {
          avatarUrl: buildAvatarUrl(
            `${mentor._id}-${interestTags.join('-')}`
          ),
          interestTags,
          skillBadges: badges,
          performanceSummary: narrative.performanceSummary,
          recommendations: narrative.recommendations,
          generationMode: narrative.generationMode,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Mentor AI profile error:', error.message);

      return res.status(500).json({
        error: 'Unable to generate the mentor profile'
      });
    }
  }
);


// --------------------------------------------------
// Update Mentor Interests
// PUT /api/mentor/ai-profile/interests
// --------------------------------------------------

router.put(
  '/mentor/ai-profile/interests',
  authenticate,
  async (req, res) => {
    const result = validateInterests(req.body?.interests);

    if (result.error) {
      return res.status(400).json({
        error: result.error
      });
    }

    try {
      const mentor = await Mentor.findByIdAndUpdate(
        req.mentor._id,
        {
          $set: {
            interests: result.interests
          }
        },
        {
          new: true,
          runValidators: true
        }
      ).select('interests');

      if (!mentor) {
        return res.status(404).json({
          error: 'Mentor not found'
        });
      }

      return res.status(200).json({
        message: 'Interests updated successfully',
        interests: mentor.interests
      });

    } catch (error) {
      console.error('Update mentor interests error:', error.message);

      return res.status(500).json({
        error: 'Unable to update interests'
      });
    }
  }
);


module.exports = router;
