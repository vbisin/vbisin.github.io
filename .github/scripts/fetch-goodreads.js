const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// Goodreads user ID for vittoriobisin (resolved from https://www.goodreads.com/vittoriobisin)
const GOODREADS_USER_ID = '203522287';
// Dedicated feed for whatever is on the "currently-reading" shelf.
const CURRENTLY_READING_URL = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=currently-reading`;
// Dedicated feed for the "read" shelf only - excludes to-read/currently-reading.
const READ_SHELF_URL = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=read`;

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Fetch a Goodreads shelf RSS feed and return its raw <item> entries.
async function fetchShelfItems(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GitHubAction/1.0)'
    },
    timeout: 30000 // 30 seconds timeout
  });

  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(response.data);

  if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
    return [];
  }

  return Array.isArray(result.rss.channel.item)
    ? result.rss.channel.item
    : [result.rss.channel.item];
}

// Normalize one raw RSS <item> into the shape the page expects.
function parseBook(item) {
  try {
    const title = (item.title || '').toString().trim();

    // author_name is usually a plain string, but xml2js can wrap it in
    // an object if the tag ever carries attributes - handle both.
    let author = item.author_name || '';
    if (author && typeof author === 'object') {
      author = author._ || author['#text'] || '';
    }
    author = author.toString().trim();

    // Prefer the largest cover image Goodreads provides, falling back
    // through smaller sizes, and finally scraping the <description>
    // HTML blob (same fallback pattern used for Letterboxd posters).
    let coverUrl =
      item.book_large_image_url ||
      item.book_medium_image_url ||
      item.book_image_url ||
      item.book_small_image_url ||
      '';

    if (!coverUrl && item.description && typeof item.description === 'string') {
      const imgMatch = item.description.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch && imgMatch[1]) {
        coverUrl = imgMatch[1];
      }
    }

    // Kept only for sorting - not displayed on the page.
    const dateAdded = item.user_date_added
      ? new Date(item.user_date_added).toISOString()
      : (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString());

    // The date the user actually marked the book as read. Goodreads leaves
    // this blank for books that were shelved as "read" without a read date
    // ever being set, so it's null (not a fabricated date) when absent -
    // callers should fall back to dateAdded for those.
    const rawReadAt = item.user_read_at;
    const dateRead = rawReadAt && rawReadAt.toString().trim()
      ? new Date(rawReadAt).toISOString()
      : null;

    return {
      title,
      author,
      link: item.link || '',
      coverUrl,
      dateAdded,
      dateRead
    };
  } catch (error) {
    console.error('Error processing item:', error);
    return null;
  }
}

async function fetchGoodreadsData() {
  const emptyResult = { currentlyReading: [], recentlyRead: [] };

  try {
    console.log('Starting Goodreads data fetch process...');

    console.log(`Fetching currently-reading shelf: ${CURRENTLY_READING_URL}`);
    const currentlyReadingItems = await fetchShelfItems(CURRENTLY_READING_URL);
    console.log(`Found ${currentlyReadingItems.length} items on currently-reading shelf`);

    console.log(`Fetching read shelf: ${READ_SHELF_URL}`);
    const readItems = await fetchShelfItems(READ_SHELF_URL);
    console.log(`Found ${readItems.length} items on read shelf`);

    const currentlyReading = currentlyReadingItems
      .map(parseBook)
      .filter(book => book !== null && book.title)
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 12);

    // Don't show a book in "Recently Read" if it's already shown in
    // "Currently Reading" (shouldn't normally overlap, but kept as a safety net).
    const currentlyReadingLinks = new Set(currentlyReading.map(book => book.link));

    // Sort by the date the book was actually marked read, falling back to
    // date added for books that were shelved as "read" without a read date.
    const recentlyRead = readItems
      .map(parseBook)
      .filter(book => book !== null && book.title)
      .filter(book => !currentlyReadingLinks.has(book.link))
      .sort((a, b) => new Date(b.dateRead || b.dateAdded) - new Date(a.dateRead || a.dateAdded))
      .slice(0, 12);

    const data = { currentlyReading, recentlyRead };

    fs.writeFileSync(
      path.join(dataDir, 'goodreads.json'),
      JSON.stringify(data, null, 2)
    );

    console.log(`Successfully saved ${currentlyReading.length} currently-reading and ${recentlyRead.length} recently-read books`);
  } catch (error) {
    console.error('Error fetching Goodreads data:');
    console.error(error);

    // Make sure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save empty result so the page degrades gracefully
    fs.writeFileSync(
      path.join(dataDir, 'goodreads.json'),
      JSON.stringify(emptyResult, null, 2)
    );

    console.error('Saved empty data to goodreads.json due to error');
    process.exit(1);
  }
}

// Run the fetch function
fetchGoodreadsData();
