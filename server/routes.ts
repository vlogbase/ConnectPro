import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertUserSchema, 
  insertWorkExperienceSchema, 
  insertEducationSchema,
  insertSkillSchema,
  insertUserSkillSchema,
  insertCategorySchema,
  insertServiceSchema,
  insertPostSchema,
  insertCommentSchema,
  insertReactionSchema,
  insertInstanceSchema,
  insertFederatedInstanceSchema,
  type Post,
  type Service
} from "@shared/schema";
import { createActor, processInboxActivity, createActivity } from "./activitypub";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { format, subDays } from "date-fns";

// Helper function to create time series data for analytics
function createTimeSeriesData(daysRange: number, data: any[]) {
  const now = new Date();
  return Array.from({ length: daysRange }).map((_, i) => {
    const date = subDays(now, daysRange - i - 1);
    const formattedDate = format(date, 'MM/dd');
    
    // Count items created on this date
    const count = data.filter(item => {
      const itemDate = new Date(item.createdAt);
      return format(itemDate, 'MM/dd') === formattedDate;
    }).length;
    
    return {
      date: formattedDate,
      count
    };
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Authentication
  await setupAuth(app);
  
  // Authentication status endpoint
  app.get('/api/auth/user', (req: any, res) => {
    res.json(req.session?.passport?.user || null);
  });
  
  // Error handler for validation errors
  const validateRequest = (schema: z.ZodType<any, any>, data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new Error(validationError.message);
      }
      throw error;
    }
  };

  // User Profile Routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is updating their own profile
      if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      const userData = validateRequest(insertUserSchema.partial(), req.body);
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Work Experience Routes
  app.post('/api/work-experiences', isAuthenticated, async (req: any, res) => {
    try {
      const workExperienceData = validateRequest(insertWorkExperienceSchema, {
        ...req.body,
        userId: req.user.userId
      });
      
      const workExperience = await storage.createWorkExperience(workExperienceData);
      res.status(201).json(workExperience);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/users/:id/work-experiences', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const workExperiences = await storage.getWorkExperiencesByUserId(userId);
      res.json(workExperiences);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.put('/api/work-experiences/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workExpId = parseInt(req.params.id);
      const workExperienceData = validateRequest(insertWorkExperienceSchema.partial(), req.body);
      
      // Make sure user owns the work experience
      const workExperiences = await storage.getWorkExperiencesByUserId(req.user.userId);
      if (!workExperiences.some(exp => exp.id === workExpId)) {
        return res.status(403).json({ message: 'Not authorized to update this work experience' });
      }
      
      const updatedWorkExp = await storage.updateWorkExperience(workExpId, workExperienceData);
      
      if (!updatedWorkExp) {
        return res.status(404).json({ message: 'Work experience not found' });
      }
      
      res.json(updatedWorkExp);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete('/api/work-experiences/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workExpId = parseInt(req.params.id);
      
      // Make sure user owns the work experience
      const workExperiences = await storage.getWorkExperiencesByUserId(req.user.userId);
      if (!workExperiences.some(exp => exp.id === workExpId)) {
        return res.status(403).json({ message: 'Not authorized to delete this work experience' });
      }
      
      await storage.deleteWorkExperience(workExpId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Education Routes
  app.post('/api/educations', isAuthenticated, async (req: any, res) => {
    try {
      const educationData = validateRequest(insertEducationSchema, {
        ...req.body,
        userId: req.user.userId
      });
      
      const education = await storage.createEducation(educationData);
      res.status(201).json(education);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/users/:id/educations', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const educations = await storage.getEducationsByUserId(userId);
      res.json(educations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.put('/api/educations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const educationId = parseInt(req.params.id);
      const educationData = validateRequest(insertEducationSchema.partial(), req.body);
      
      // Make sure user owns the education
      const educations = await storage.getEducationsByUserId(req.user.userId);
      if (!educations.some(edu => edu.id === educationId)) {
        return res.status(403).json({ message: 'Not authorized to update this education' });
      }
      
      const updatedEducation = await storage.updateEducation(educationId, educationData);
      
      if (!updatedEducation) {
        return res.status(404).json({ message: 'Education not found' });
      }
      
      res.json(updatedEducation);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete('/api/educations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const educationId = parseInt(req.params.id);
      
      // Make sure user owns the education
      const educations = await storage.getEducationsByUserId(req.user.userId);
      if (!educations.some(edu => edu.id === educationId)) {
        return res.status(403).json({ message: 'Not authorized to delete this education' });
      }
      
      await storage.deleteEducation(educationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Skills Routes
  app.post('/api/skills', isAuthenticated, async (req, res) => {
    try {
      const skillData = validateRequest(insertSkillSchema, req.body);
      
      // Check if skill already exists
      const skills = await storage.getSkills();
      const existingSkill = skills.find(s => s.name.toLowerCase() === skillData.name.toLowerCase());
      
      if (existingSkill) {
        return res.json(existingSkill);
      }
      
      const skill = await storage.createSkill(skillData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/skills', async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // User Skills Routes
  app.post('/api/user-skills', isAuthenticated, async (req: any, res) => {
    try {
      const userSkillData = validateRequest(insertUserSkillSchema, {
        ...req.body,
        userId: req.user.userId
      });
      
      const userSkill = await storage.addUserSkill(userSkillData);
      res.status(201).json(userSkill);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/users/:id/skills', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userSkills = await storage.getUserSkills(userId);
      res.json(userSkills);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete('/api/user-skills/:skillId', isAuthenticated, async (req: any, res) => {
    try {
      const skillId = parseInt(req.params.skillId);
      await storage.removeUserSkill(req.user.userId, skillId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.post('/api/user-skills/:userId/:skillId/endorse', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const skillId = parseInt(req.params.skillId);
      
      const updatedUserSkill = await storage.endorseSkill(userId, skillId);
      
      if (!updatedUserSkill) {
        return res.status(404).json({ message: 'User skill not found' });
      }
      
      res.json(updatedUserSkill);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Categories Routes
  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categoryData = validateRequest(insertCategorySchema, req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Services Routes
  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const serviceData = validateRequest(insertServiceSchema, {
        ...req.body,
        userId: req.user.userId
      });
      
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/services', async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const location = req.query.location as string || '';
      
      const services = await storage.searchServices(query, categoryId, location);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/services/:id', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/users/:id/services', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const services = await storage.getServicesByUserId(userId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.put('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const serviceData = validateRequest(insertServiceSchema.partial(), req.body);
      
      // Make sure user owns the service
      const service = await storage.getServiceById(serviceId);
      if (!service || service.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to update this service' });
      }
      
      const updatedService = await storage.updateService(serviceId, serviceData);
      
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      // Make sure user owns the service
      const service = await storage.getServiceById(serviceId);
      if (!service || service.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to delete this service' });
      }
      
      await storage.deleteService(serviceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Post Routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const postData = validateRequest(insertPostSchema, {
        ...req.body,
        userId: req.user.userId
      });
      
      const post = await storage.createPost(postData);
      
      // Create ActivityPub activity for this post if the user has an actor
      const user = await storage.getUser(req.user.userId);
      if (user && user.actorUrl) {
        const objectUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/api/posts/${post.id}`;
        
        const activityObject = {
          id: objectUrl,
          type: 'Note',
          content: post.content,
          attributedTo: user.actorUrl,
          published: new Date().toISOString()
        };
        
        await createActivity('Create', req.user.userId, activityObject, ['https://www.w3.org/ns/activitystreams#Public']);
      }
      
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || '10');
      const offset = parseInt(req.query.offset as string || '0');
      
      const posts = await storage.getFeedPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/users/:id/posts', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const posts = await storage.getUserPosts(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      // Make sure user owns the post
      const post = await storage.getPostById(postId);
      if (!post || post.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }
      
      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Comment Routes
  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      const commentData = validateRequest(insertCommentSchema, {
        ...req.body,
        postId,
        userId: req.user.userId
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Reaction Routes
  app.post('/api/posts/:postId/reactions', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      // Check if reaction already exists
      const existingReaction = await storage.getReactionByUserAndPost(req.user.userId, postId);
      
      if (existingReaction) {
        // If the type is the same, remove it (toggle)
        if (existingReaction.type === req.body.type) {
          await storage.deleteReaction(existingReaction.id);
          return res.status(204).send();
        } else {
          // If type is different, update it
          await storage.deleteReaction(existingReaction.id);
        }
      }
      
      const reactionData = validateRequest(insertReactionSchema, {
        ...req.body,
        postId,
        userId: req.user.userId
      });
      
      const reaction = await storage.createReaction(reactionData);
      res.status(201).json(reaction);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/posts/:postId/reactions', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const reactions = await storage.getReactionsByPostId(postId);
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Instance Routes
  app.post('/api/instances', isAuthenticated, async (req: any, res) => {
    try {
      const instanceData = validateRequest(insertInstanceSchema, {
        ...req.body,
        adminId: req.user.userId
      });
      
      const instance = await storage.createInstance(instanceData);
      res.status(201).json(instance);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/instances/:id', async (req, res) => {
    try {
      const instanceId = parseInt(req.params.id);
      const instance = await storage.getInstanceById(instanceId);
      
      if (!instance) {
        return res.status(404).json({ message: 'Instance not found' });
      }
      
      res.json(instance);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Instance Analytics Routes
  app.get('/api/instances/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.id);
      const instance = await storage.getInstanceById(instanceId);
      
      if (!instance) {
        return res.status(404).json({ message: 'Instance not found' });
      }
      
      // Check if user is admin of this instance
      if (instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this instance' });
      }
      
      // Get all data needed for analytics
      const users = await storage.getUsersByInstanceId(instanceId);
      const activities = await storage.getActivitiesByInstanceId(instanceId);
      const federations = await storage.getFederationsByInstanceId(instanceId);
      
      // Create time series data for user growth (last 30 days)
      const userGrowthData = createTimeSeriesData(30, users);
      
      // Create time series data for activities (last 30 days)
      const activityData = createTimeSeriesData(30, activities);
      
      // Calculate activity by type
      const activityByType = activities.reduce((acc: Record<string, number>, activity) => {
        const type = activity.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      // Federation status metrics
      const federationMetrics = {
        total: federations.length,
        active: federations.filter(fed => fed.status === 'active').length,
        pending: federations.filter(fed => fed.status === 'pending').length,
        rejected: federations.filter(fed => fed.status === 'rejected').length
      };
      
      res.json({
        users: {
          total: users.length,
          growth: userGrowthData
        },
        activities: {
          total: activities.length,
          byType: activityByType,
          recent: activityData
        },
        federation: federationMetrics,
        instance: {
          name: instance.name,
          createdAt: instance.createdAt,
          domain: instance.domain
        }
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/users/:id/instances', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const instances = await storage.getInstancesByAdminId(userId);
      res.json(instances);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.put('/api/instances/:id', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.id);
      const instanceData = validateRequest(insertInstanceSchema.partial(), req.body);
      
      // Make sure user is the admin of the instance
      const instance = await storage.getInstanceById(instanceId);
      if (!instance || instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to update this instance' });
      }
      
      const updatedInstance = await storage.updateInstance(instanceId, instanceData);
      
      if (!updatedInstance) {
        return res.status(404).json({ message: 'Instance not found' });
      }
      
      res.json(updatedInstance);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Federation Routes
  app.post('/api/instances/:instanceId/federations', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      
      // Make sure user is the admin of the instance
      const instance = await storage.getInstanceById(instanceId);
      if (!instance || instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to create federation for this instance' });
      }
      
      const federationData = validateRequest(insertFederatedInstanceSchema, {
        ...req.body,
        instanceId
      });
      
      const federation = await storage.createFederation(federationData);
      res.status(201).json(federation);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/instances/:instanceId/federations', async (req, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      const federations = await storage.getFederationsByInstanceId(instanceId);
      res.json(federations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.put('/api/federations/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const federationId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const updatedFederation = await storage.updateFederationStatus(federationId, status);
      
      if (!updatedFederation) {
        return res.status(404).json({ message: 'Federation not found' });
      }
      
      res.json(updatedFederation);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Activity Routes
  app.get('/api/instances/:instanceId/activities', async (req, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      const activities = await storage.getActivitiesByInstanceId(instanceId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Analytics Routes
  app.get('/api/instances/:instanceId/analytics/users', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      const timeRange = req.query.timeRange || 'week';
      
      // Verify the user is an admin of this instance
      const instance = await storage.getInstanceById(instanceId);
      if (!instance || instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this instance' });
      }
      
      // For now return sample data, to be replaced with actual data from database
      const now = new Date();
      const daysInRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      
      // Get users for this instance and their registration dates
      const usersData = await storage.getUsersByInstanceId(instanceId);
      
      // Format response
      const formattedData = {
        totalUsers: usersData.length,
        activeUsers: Math.floor(usersData.length * 0.7), // Consider 70% of users active for demo
        newUsers: usersData.filter(user => {
          const createdAt = new Date(user.createdAt);
          const diffTime = Math.abs(now.getTime() - createdAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= daysInRange;
        }).length,
        usersOverTime: createTimeSeriesData(daysInRange, usersData)
      };
      
      res.json(formattedData);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/instances/:instanceId/analytics/posts', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      const timeRange = req.query.timeRange || 'week';
      
      // Verify the user is an admin of this instance
      const instance = await storage.getInstanceById(instanceId);
      if (!instance || instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this instance' });
      }
      
      // Get posts for this instance
      const postsData = await storage.getPostsByInstanceId(instanceId);
      
      // Format response
      const formattedData = {
        totalPosts: postsData.length,
        postsOverTime: createTimeSeriesData(timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365, postsData),
        postsByType: [
          { name: 'Text', value: postsData.filter((post: Post) => !post.mediaUrl).length },
          { name: 'Media', value: postsData.filter((post: Post) => !!post.mediaUrl).length }
        ]
      };
      
      res.json(formattedData);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/instances/:instanceId/analytics/services', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      const timeRange = req.query.timeRange || 'week';
      
      // Verify the user is an admin of this instance
      const instance = await storage.getInstanceById(instanceId);
      if (!instance || instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this instance' });
      }
      
      // Get services for this instance
      const servicesData = await storage.getServicesByInstanceId(instanceId);
      
      // Get categories for grouping
      const categories = await storage.getCategories();
      
      // Group services by category
      const servicesByCategory = categories.map(category => ({
        name: category.name,
        value: servicesData.filter((service: Service) => service.categoryId === category.id).length
      })).filter(item => item.value > 0);
      
      // Add uncategorized if needed
      const uncategorizedCount = servicesData.filter((service: Service) => !service.categoryId).length;
      if (uncategorizedCount > 0) {
        servicesByCategory.push({ name: 'Uncategorized', value: uncategorizedCount });
      }
      
      // Format response
      const formattedData = {
        totalServices: servicesData.length,
        servicesOverTime: createTimeSeriesData(timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365, servicesData),
        servicesByCategory
      };
      
      res.json(formattedData);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/instances/:instanceId/analytics/federation', isAuthenticated, async (req: any, res) => {
    try {
      const instanceId = parseInt(req.params.instanceId);
      
      // Verify the user is an admin of this instance
      const instance = await storage.getInstanceById(instanceId);
      if (!instance || instance.adminId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this instance' });
      }
      
      // Get federation data
      const federationsData = await storage.getFederationsByInstanceId(instanceId);
      
      // Group by status
      const federationStats = [
        { name: 'Connected', value: federationsData.filter(fed => fed.status === 'active').length },
        { name: 'Pending', value: federationsData.filter(fed => fed.status === 'pending').length },
        { name: 'Rejected', value: federationsData.filter(fed => fed.status === 'rejected').length }
      ];
      
      // Format response
      const formattedData = {
        totalConnections: federationsData.length,
        federationStats,
        recentConnections: federationsData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      };
      
      res.json(formattedData);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/api/activities/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || '10');
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // ActivityPub Routes
  app.get('/activitypub/actor/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const actor = await createActor(userId);
      
      if (!actor) {
        return res.status(404).json({ message: 'Actor not found' });
      }
      
      res.json(actor);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.post('/activitypub/actor/:id/inbox', async (req, res) => {
    try {
      // Find the instance for this user
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const instances = await storage.getInstancesByAdminId(userId);
      
      if (instances.length === 0) {
        return res.status(404).json({ message: 'No instances found for this user' });
      }
      
      // Process the incoming activity
      await processInboxActivity(req.body, instances[0].id);
      
      res.status(202).json({ message: 'Activity accepted' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get('/activitypub/actor/:id/outbox', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get posts for this user
      const posts = await storage.getUserPosts(userId);
      
      // Convert to ActivityPub format
      const items = posts.map(post => ({
        id: `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/api/posts/${post.id}`,
        type: 'Create',
        actor: user.actorUrl,
        object: {
          id: `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/api/posts/${post.id}`,
          type: 'Note',
          content: post.content,
          published: post.createdAt.toISOString()
        }
      }));
      
      const outbox = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: `${user.actorUrl}/outbox`,
        type: 'OrderedCollection',
        totalItems: items.length,
        orderedItems: items
      };
      
      res.json(outbox);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
