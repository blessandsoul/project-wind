import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPassword = await argon2.hash('Admin123!');
  const userPassword = await argon2.hash('User123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
    },
  });

  // Seed templates
  const templates = [
    {
      name: 'Professional Headshot',
      slug: 'professional-headshot',
      description: 'Transform your photo into a polished professional headshot with studio lighting and a clean background.',
      category: 'portrait',
      promptTemplate: 'Transform this photo into a professional corporate headshot. Apply studio-quality lighting, soften skin naturally, use a clean neutral background, and ensure the subject looks polished and professional. Keep the likeness accurate.',
      providerKey: 'gemini',
      creditCost: 1,
      sortOrder: 1,
    },
    {
      name: 'Vintage Film Style',
      slug: 'vintage-film-style',
      description: 'Apply a warm vintage film aesthetic with grain, faded tones, and nostalgic color grading.',
      category: 'style-transfer',
      promptTemplate: 'Restyle this image with a vintage analog film look. Add subtle film grain, warm faded tones, slightly desaturated colors with a nostalgic feel. Apply a gentle vignette and soft contrast similar to 35mm Kodak Portra film. Keep the original composition and subject.',
      providerKey: 'gemini',
      creditCost: 1,
      sortOrder: 2,
    },
    {
      name: 'Studio Background',
      slug: 'studio-background',
      description: 'Replace the background with a clean professional studio backdrop while keeping the subject sharp.',
      category: 'background',
      promptTemplate: 'Replace the background of this image with a clean professional photo studio backdrop using a smooth gradient from light gray to white. Keep the subject perfectly intact with natural edges. Ensure professional studio lighting on the subject.',
      providerKey: 'gemini',
      creditCost: 1,
      sortOrder: 3,
    },
    {
      name: 'Pop Art Portrait',
      slug: 'pop-art-portrait',
      description: 'Convert your photo into a bold Andy Warhol-inspired pop art portrait with vibrant colors.',
      category: 'style-transfer',
      promptTemplate: 'Transform this photo into a bold pop art portrait inspired by Andy Warhol. Use vibrant, contrasting colors, halftone dot patterns, thick outlines, and flat color areas. Make it visually striking and artistic while maintaining the subject likeness.',
      providerKey: 'gemini',
      creditCost: 1,
      sortOrder: 4,
    },
    {
      name: 'Watercolor Painting',
      slug: 'watercolor-painting',
      description: 'Transform your photo into an elegant watercolor painting with soft brushstrokes and flowing colors.',
      category: 'style-transfer',
      promptTemplate: 'Convert this photograph into a beautiful watercolor painting. Use soft, flowing brushstrokes with translucent color washes. Allow colors to bleed naturally at the edges. Maintain the overall composition but give it an artistic, hand-painted quality with visible paper texture.',
      providerKey: 'gemini',
      creditCost: 1,
      sortOrder: 5,
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
  }

  // Seed video templates
  const videoTemplates = [
    {
      name: 'Animate Image',
      slug: 'animate-image',
      description: 'Bring your image to life with smooth, natural motion. The AI analyzes the scene and adds realistic animation.',
      category: 'animation',
      type: 'VIDEO' as const,
      promptTemplate: 'Animate this image with smooth, natural motion. Add subtle movement that brings the scene to life — gentle motion in the environment, natural sway, or flowing elements. Keep the animation fluid and cinematic.',
      providerKey: 'gemini',
      creditCost: 5,
      sortOrder: 10,
    },
    {
      name: 'Cinematic Motion',
      slug: 'cinematic-motion',
      description: 'Create a cinematic video with dramatic camera movement and film-quality motion from your still image.',
      category: 'animation',
      type: 'VIDEO' as const,
      promptTemplate: 'Create a cinematic video from this image with dramatic camera movement. Apply a slow, smooth dolly or pan effect. Add depth-of-field and filmic motion blur. Make it feel like a scene from a high-budget film production.',
      providerKey: 'gemini',
      creditCost: 5,
      sortOrder: 11,
    },
  ];

  for (const template of videoTemplates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
  }

  // Seed AI models
  const aiModels = [
    {
      providerKey: 'gemini',
      modelId: 'gemini-2.5-flash-image',
      name: 'Gemini 2.5 Flash (Image)',
      description: 'Fast image editing by Google Gemini. Great balance of speed and quality.',
      type: 'IMAGE' as const,
      creditCost: 1,
      sortOrder: 1,
    },
    {
      providerKey: 'gemini',
      modelId: 'veo-3.1-fast-generate-preview',
      name: 'Veo 3.1 Fast (Video)',
      description: 'Fast video generation by Google Gemini Veo. Cheaper and faster, ideal for testing. Generates 4-8 second videos from images.',
      type: 'VIDEO' as const,
      creditCost: 5,
      sortOrder: 10,
    },
  ];

  for (const model of aiModels) {
    await prisma.aiModel.upsert({
      where: {
        providerKey_modelId: {
          providerKey: model.providerKey,
          modelId: model.modelId,
        },
      },
      update: {},
      create: model,
    });
  }

  // Remove deprecated model IDs
  await prisma.aiModel.deleteMany({
    where: {
      providerKey: 'gemini',
      modelId: { in: ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash', 'gemini-2.5-flash-preview-image-generation'] },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seeded users:', { admin: admin.email, user: user.email });
  // eslint-disable-next-line no-console
  console.log('Seeded templates:', [...templates, ...videoTemplates].map((t) => `${t.name} (${t.type ?? 'IMAGE'})`));
  // eslint-disable-next-line no-console
  console.log('Seeded AI models:', aiModels.map((m) => `${m.name} (${m.type})`));
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
