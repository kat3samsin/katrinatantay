/**
 * WordPress REST API integration
 *
 * Configure your WordPress site URL below to fetch blog posts.
 * The WordPress REST API is available at: {your-site}/wp-json/wp/v2/posts
 */

// TODO: Replace with your WordPress site URL
const WORDPRESS_URL = import.meta.env.WORDPRESS_URL || 'https://your-wordpress-site.com';

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

/**
 * Fetch posts from WordPress REST API
 */
export async function getPosts(count: number = 10): Promise<BlogPost[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=${count}&_embed`
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
      `${WORDPRESS_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`
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

// Helper functions
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
