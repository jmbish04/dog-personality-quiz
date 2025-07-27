import { TraitScores } from './scoring';
import { ensurePlaceholdersExist, getPlaceholderKey } from './placeholders';

export async function generateTraitImages(ai: any, bucket: R2Bucket, session: any, scores: TraitScores): Promise<{ [trait: string]: string }> {
  // Ensure placeholder images exist before we start
  await ensurePlaceholdersExist(bucket);
  const generatedImages: { [trait: string]: string } = {};
  
  for (const [trait, data] of Object.entries(scores)) {
    try {
      const imageKey = await generateSingleTraitImage(ai, bucket, session, trait, data);
      if (imageKey) {
        generatedImages[trait] = imageKey;
      }
    } catch (error) {
      console.error(`Error generating image for ${trait}:`, error);
    }
  }
  
  return generatedImages;
}

async function generateSingleTraitImage(ai: any, bucket: R2Bucket, session: any, trait: string, traitData: any): Promise<string | null> {
  try {
    // Create a prompt for image generation based on the dog and trait
    const breed = session.breed || 'mixed breed';
    const prompt = `A cute ${breed} dog expressing ${trait}, ${traitData.label.toLowerCase()}, ${traitData.description}, cartoon style, colorful, cheerful, high quality`;
    
    // Generate image using Cloudflare AI
    const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: prompt
    });
    
    if (!response || !response.image) {
      throw new Error('No image generated');
    }
    
    // Convert the response to a proper format for R2
    const imageBuffer = response.image;
    const imageKey = `results/${session.slug}-${trait}-${Date.now()}.png`;
    
    // Upload to R2
    await bucket.put(imageKey, imageBuffer, {
      httpMetadata: {
        contentType: 'image/png'
      }
    });
    
    return imageKey;
  } catch (error) {
    console.error(`Error in generateSingleTraitImage for ${trait}:`, error);
    
    // Return a placeholder image key that actually exists
    return getPlaceholderKey(trait);
  }
}

export async function generateBaseImage(ai: any, bucket: R2Bucket, session: any): Promise<string | null> {
  try {
    const breed = session.breed || 'mixed breed';
    const prompt = `A beautiful ${breed} dog named ${session.dog_name}, friendly expression, sitting pose, high quality photo, well-lit, clear background`;
    
    const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: prompt
    });
    
    if (!response || !response.image) {
      throw new Error('No base image generated');
    }
    
    const imageBuffer = response.image;
    const imageKey = `base/${session.slug}-base-${Date.now()}.png`;
    
    await bucket.put(imageKey, imageBuffer, {
      httpMetadata: {
        contentType: 'image/png'
      }
    });
    
    return imageKey;
  } catch (error) {
    console.error('Error generating base image:', error);
    return null;
  }
}