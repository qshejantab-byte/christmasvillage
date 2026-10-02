import type { ImageMetadata } from 'astro';
import siteData from '../data/site.json';
import ctaData from '../data/ctas.json';
import navData from '../data/navigation.json';
import chapterData from '../data/chapters.json';
import zoneData from '../data/zones.json';
import mediaData from '../data/media.json';
import faqData from '../data/faq.json';
import homeData from '../data/home.json';

export type Status = 'confirmed' | 'pending' | 'hidden';

export interface Cta {
  label: string;
  href: string | null;
  external: boolean;
  status: Status;
  note?: string;
}

export interface Zone {
  n: number;
  id: string;
  name: string;
  chapter: string;
  also?: string[];
  summary: string;
  mapLabel: string | null;
  hotspots: { x: number; y: number }[];
  status: Status;
}

export interface Chapter {
  id: string;
  number: string;
  name: string;
  title: string;
  titleLines?: string[];
  lede: string;
  body?: string;
  route?: string[];
  outlets?: { name: string; offer: string }[];
  items?: { zone: string; name: string; text: string }[];
  activities?: string[];
  partner?: string;
  note?: string;
  footnote?: string;
  media: string[];
  status: Status;
}

export interface VideoSource {
  mp4: string;
  webm?: string;
  mobileMp4?: string;
  mobileWebm?: string;
  poster?: string;
}

export interface MediaSlot {
  image: string;
  alt: string;
  position?: string;
  representative?: boolean;
  video: VideoSource | null;
}

export interface ResolvedMedia extends MediaSlot {
  id: string;
  src: ImageMetadata;
}

export const site = siteData;
export const navigation = navData;
export const home = homeData;
export const chapters = (chapterData as Chapter[]).filter(isPublic);
export const zones = (zoneData as Zone[]).filter(isPublic);
export const faq = faqData.map((g) => ({ ...g, items: g.items.filter((i) => isPublic(i as { status: Status })) }));

export function isPublic(item: { status: Status | string }) {
  return item.status !== 'hidden';
}

export function isConfirmed(item: { status: Status | string } | null | undefined) {
  return !!item && item.status === 'confirmed';
}

export function url(path: string) {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}

export function cta(key: keyof typeof ctaData): Cta | null {
  const item = ctaData[key] as Cta;
  if (!item || item.status !== 'confirmed' || !item.href) return null;
  return { ...item, href: url(item.href) };
}

const imageFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/images/*.{jpg,jpeg,png,webp,avif}', { eager: true });

function findImage(name: string) {
  const entry = Object.entries(imageFiles).find(([path]) => path.endsWith(`/${name}`));
  if (!entry) throw new Error(`Media image not found: ${name}`);
  return entry[1].default;
}

export function media(id: string): ResolvedMedia {
  const slot = (mediaData as Record<string, MediaSlot>)[id];
  if (!slot) throw new Error(`Unknown media slot: ${id}`);
  return { ...slot, id, src: findImage(slot.image) };
}

export function chapter(id: string) {
  const found = chapters.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown chapter: ${id}`);
  return found;
}

export function zonesFor(chapterId: string) {
  return zones.filter((z) => z.chapter === chapterId || z.also?.includes(chapterId));
}
