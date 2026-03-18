import { Preset } from '@models/preset.model';

export const PRESETS_MOCK: Preset[] = [
  {
    id: 'preset-anime-1',
    name: 'Anime Neon Girl',
    category: 'anime',
    prompt: 'anime girl portrait, neon city lights, vibrant colors, ultra detailed, soft glow, dynamic composition',
    ratio: '9:16',
    seed: 19,
    type: 'image',
    previewIds: ['img-007', 'img-003', 'sa-02']
  },
  {
    id: 'preset-anime-2',
    name: 'Fantasy Anime Castle',
    category: 'anime',
    prompt: 'anime fantasy castle on the hill, mist, sunrise light, dramatic sky, rich detail',
    ratio: '16:9',
    seed: 15,
    type: 'image',
    previewIds: ['img-005', 'img-012', 'sa-03']
  },
  {
    id: 'preset-realistic-1',
    name: 'Studio Product Shot',
    category: 'realistic',
    prompt: 'realistic premium product photography, studio setup, softbox lighting, clean shadow, luxury commercial look',
    ratio: '1:1',
    seed: 14,
    type: 'image',
    previewIds: ['img-004', 'img-010', 'sb-02']
  },
  {
    id: 'preset-realistic-2',
    name: 'Portrait Photo 85mm',
    category: 'realistic',
    prompt: 'realistic portrait photography, 85mm lens, shallow depth of field, natural skin tone, editorial quality',
    ratio: '9:16',
    seed: 12,
    type: 'image',
    previewIds: ['img-002', 'img-006', 'sb-04']
  },
  {
    id: 'preset-myth-1',
    name: 'Mythic Golden Temple',
    category: 'myth',
    prompt: 'mythological golden temple in the clouds, divine atmosphere, cinematic lighting, epic fantasy scale',
    ratio: '16:9',
    seed: 25,
    type: 'image',
    previewIds: ['img-012', 'img-009', 'sc-03']
  },
  {
    id: 'preset-myth-2',
    name: 'Dragon Dawn',
    category: 'myth',
    prompt: 'ancient dragon above mountain sunrise, mist, epic fantasy art, god rays, monumental composition',
    ratio: '16:9',
    seed: 24,
    type: 'image',
    previewIds: ['img-011', 'img-012', 'sc-01']
  },
  {
    id: 'preset-cinematic-1',
    name: 'Neon Street Film Look',
    category: 'cinematic',
    prompt: 'cinematic night street, neon reflections, moody atmosphere, film grain, dramatic framing',
    ratio: '16:9',
    seed: 13,
    type: 'image',
    previewIds: ['img-003', 'img-009', 'sb-03']
  },
  {
    id: 'preset-cinematic-2',
    name: 'Ocean Motion Clip',
    category: 'cinematic',
    prompt: 'cinematic ocean b-roll, slow motion, soft contrast, travel film aesthetics',
    ratio: '16:9',
    seed: 17,
    type: 'video',
    previewIds: ['vid-002', 'vid-003', 'sa-04']
  },
  {
    id: 'preset-product-1',
    name: 'Luxury Packaging',
    category: 'product',
    prompt: 'luxury packaging product ad, premium matte material, reflective highlights, clean background, e-commerce hero image',
    ratio: '1:1',
    seed: 23,
    type: 'image',
    previewIds: ['img-010', 'img-004', 'sb-01']
  },
  {
    id: 'preset-product-2',
    name: 'Cozy Interior Ad',
    category: 'product',
    prompt: 'interior commercial photography, cozy modern design, warm light, magazine quality composition',
    ratio: '16:9',
    seed: 20,
    type: 'image',
    previewIds: ['img-008', 'img-009', 'sc-02']
  }
];
