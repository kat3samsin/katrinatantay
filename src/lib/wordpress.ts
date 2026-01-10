/**
 * WordPress REST API integration
 *
 * Configure your WordPress site URL below to fetch blog posts.
 * The WordPress REST API is available at: {your-site}/wp-json/wp/v2/posts
 */

// WordPress.com API endpoint
const WORDPRESS_URL = import.meta.env.WORDPRESS_URL || 'https://public-api.wordpress.com/wp/v2/sites/kat3samsinblog.wordpress.com';

export interface WordPressPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  formattedDate: string;
  featuredImage?: string;
}

export interface WordPressComment {
  id: number;
  post: number;
  author_name: string;
  author_url: string;
  date: string;
  content: {
    rendered: string;
  };
  author_avatar_urls?: {
    [key: string]: string;
  };
}

export interface Comment {
  id: number;
  authorName: string;
  authorUrl: string;
  date: string;
  formattedDate: string;
  content: string;
  avatarUrl?: string;
}

/**
 * Fetch posts from WordPress REST API
 */
export async function getPosts(count: number = 10): Promise<BlogPost[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/posts?per_page=${count}&_embed`
    );

    if (!response.ok) {
      console.error('Failed to fetch posts:', response.statusText);
      return [];
    }

    const posts: WordPressPost[] = await response.json();

    return posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: stripHtml(post.title.rendered),
      excerpt: stripHtml(post.excerpt.rendered),
      content: post.content.rendered,
      date: post.date,
      formattedDate: formatDate(post.date),
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    }));
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    return [];
  }
}

/**
 * Fetch a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/posts?slug=${slug}&_embed`
    );

    if (!response.ok) {
      return null;
    }

    const posts: WordPressPost[] = await response.json();

    if (posts.length === 0) {
      return null;
    }

    const post = posts[0];
    return {
      id: post.id,
      slug: post.slug,
      title: stripHtml(post.title.rendered),
      excerpt: stripHtml(post.excerpt.rendered),
      content: post.content.rendered,
      date: post.date,
      formattedDate: formatDate(post.date),
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Fetch comments for a post
 */
export async function getComments(postId: number): Promise<Comment[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/comments?post=${postId}&per_page=100`
    );

    if (!response.ok) {
      console.error('Failed to fetch comments:', response.statusText);
      return [];
    }

    const comments: WordPressComment[] = await response.json();

    return comments.map(comment => ({
      id: comment.id,
      authorName: decodeHtmlEntities(comment.author_name),
      authorUrl: comment.author_url,
      date: comment.date,
      formattedDate: formatDate(comment.date),
      content: comment.content.rendered,
      avatarUrl: comment.author_avatar_urls?.['48'] || comment.author_avatar_urls?.['24'],
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

/**
 * Get WordPress.com URL for the post (for commenting)
 */
export function getWordPressPostUrl(slug: string): string {
  return `https://kat3samsinblog.wordpress.com/${slug}/`;
}

// Helper functions
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/\[…\]/g, '…');
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '')).trim();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
