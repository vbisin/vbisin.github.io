const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// Goodreads user ID for vittoriobisin (resolved from https://www.goodreads.com/vittoriobisin)
const GOODREADS_USER_ID = '203522287';
// #ALL# is Goodreads' special shelf value that returns books across every shelf
// (read, currently-reading, to-read, and any custom shelves), not just one.
const GOODREADS_RSS_URL = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=%23ALL%23`;

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Function to fetch Goodreads RSS feed
async function fetchGoodreadsData() {
  try {
    console.log('Starting Goodreads data fetch process...');
    console.log(`Fetching from RSS URL: ${GOODREADS_RSS_URL}`);

    // Fetch RSS feed
    const response = await axios.get(GOODREADS_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GitHubAction/1.0)'
      },
      timeout: 30000 // 30 seconds timeout
    });

    console.log('RSS feed fetched successfully. Response status:', response.status);

    // Parse XML to JSON
    console.log('Parsing XML to JSON...');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    console.log('XML parsing completed. Checking for channel items...');

    // Check if there are items
    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      console.log('No items found in RSS feed.');
      fs.writeFileSync(
        path.join(dataDir, 'goodreads.json'),
        JSON.stringify([], null, 2)
      );
      console.log('Saved empty array to goodreads.json');
      return;
    }

    // Process and filter the data
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    console.log(`Found ${items.length} items in RSS feed`);

    const books = items
      .map(item => {
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

          return {
            title,
            author,
            link: item.link || '',
            coverUrl,
            dateAdded
          };
        } catch (error) {
          console.error('Error processing item:', error);
          return null;
        }
      })
      .filter(item => item !== null && item.title)
      // Most recently added/updated first
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 12); // Limit to 12 most recent books

    console.log(`Processed ${books.length} books`);

    // Save processed data to JSON file
    fs.writeFileSync(
      path.join(dataDir, 'goodreads.json'),
      JSON.stringify(books, null, 2)
    );

    console.log(`Successfully fetched and saved ${books.length} books`);
  } catch (error) {
    console.error('Error fetching Goodreads data:');
    console.error(error);

    // Make sure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save empty array
    fs.writeFileSync(
      path.join(dataDir, 'goodreads.json'),
      JSON.stringify([], null, 2)
    );

    console.error('Saved empty array to goodreads.json due to error');
    process.exit(1);
  }
}

// Run the fetch function
fetchGoodreadsData();
