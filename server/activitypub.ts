import { db } from "./db";
import { users, instances, activities } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

// ActivityPub Actor object
export interface Actor {
  '@context': string[];
  id: string;
  type: string;
  preferredUsername: string;
  name: string;
  summary?: string;
  inbox: string;
  outbox: string;
  icon?: {
    type: string;
    mediaType: string;
    url: string;
  };
}

// Activity object
export interface ActivityObject {
  '@context': string | string[];
  id: string;
  type: string;
  actor: string;
  to?: string[];
  cc?: string[];
  object?: any;
  target?: any;
  published?: string;
}

// Generate ActivityPub ID
export function generateActivityPubId(type: string, id: string | number): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
  return `https://${domain}/activitypub/${type}/${id}`;
}

// Create Actor for a user
export async function createActor(userId: number): Promise<Actor | null> {
  const user = await storage.getUser(userId);
  if (!user) return null;
  
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
  const actorId = `/activitypub/actor/${userId}`;
  const actorUrl = `https://${domain}${actorId}`;
  const inboxUrl = `${actorUrl}/inbox`;
  const outboxUrl = `${actorUrl}/outbox`;
  
  // Update user with ActivityPub URLs
  await db.update(users)
    .set({
      activityPubId: actorId,
      actorUrl,
      inboxUrl,
      outboxUrl
    })
    .where(eq(users.id, userId));
  
  const actor: Actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    id: actorUrl,
    type: 'Person',
    preferredUsername: user.username,
    name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
    summary: user.bio || undefined,
    inbox: inboxUrl,
    outbox: outboxUrl
  };
  
  if (user.profileImageUrl) {
    actor.icon = {
      type: 'Image',
      mediaType: 'image/jpeg',
      url: user.profileImageUrl
    };
  }
  
  return actor;
}

// Process incoming activity
export async function processInboxActivity(activity: ActivityObject, instanceId: number): Promise<void> {
  try {
    // Store activity in database
    await storage.createActivity({
      instanceId,
      type: activity.type,
      actorId: null, // Will be determined by resolving actor
      objectId: activity.object?.id || null,
      targetId: activity.target?.id || null,
      payload: activity as any
    });
    
    // Process based on activity type
    switch (activity.type) {
      case 'Follow':
        await handleFollowActivity(activity, instanceId);
        break;
      case 'Create':
        await handleCreateActivity(activity, instanceId);
        break;
      case 'Like':
        await handleLikeActivity(activity, instanceId);
        break;
      default:
        console.log(`Unsupported activity type: ${activity.type}`);
    }
  } catch (error) {
    console.error('Error processing activity:', error);
  }
}

// Handle Follow activity
async function handleFollowActivity(activity: ActivityObject, instanceId: number): Promise<void> {
  // Implement follow handling logic
  console.log('Processing Follow activity');
}

// Handle Create activity
async function handleCreateActivity(activity: ActivityObject, instanceId: number): Promise<void> {
  // Implement create handling logic
  console.log('Processing Create activity');
}

// Handle Like activity
async function handleLikeActivity(activity: ActivityObject, instanceId: number): Promise<void> {
  // Implement like handling logic
  console.log('Processing Like activity');
}

// Create and send an activity
export async function createActivity(type: string, actorId: number, object: any, recipients: string[]): Promise<ActivityObject> {
  const user = await storage.getUser(actorId);
  if (!user || !user.actorUrl) {
    throw new Error('User not found or has no ActivityPub profile');
  }
  
  const activity: ActivityObject = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: generateActivityPubId('activity', Date.now()),
    type,
    actor: user.actorUrl,
    object,
    to: recipients
  };
  
  // Store activity in the database
  const instance = await db.select().from(instances).where(eq(instances.adminId, actorId)).limit(1);
  
  if (instance.length > 0) {
    await storage.createActivity({
      instanceId: instance[0].id,
      type,
      actorId,
      objectId: typeof object === 'string' ? object : object.id,
      targetId: null,
      payload: activity as any
    });
  }
  
  // Actually send activity to recipients in a real implementation
  
  return activity;
}

// Fetch Actor from URL
export async function fetchActor(actorUrl: string): Promise<Actor | null> {
  try {
    const response = await fetch(actorUrl, {
      headers: {
        'Accept': 'application/activity+json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const actor = await response.json();
    return actor;
  } catch (error) {
    console.error('Error fetching actor:', error);
    return null;
  }
}
