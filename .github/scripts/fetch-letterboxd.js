const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Function to fetch Letterboxd RSS feed
async function fetchLetterboxdData() {
  try {
    console.log('Fetching Letterboxd RSS feed for user gianvittorio...');
    // Fetch RSS feed
    const response = await axios.get('https://letterboxd.com/gianvittorio/rss/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GitHubAction/1.0)'
      },
      timeout: 15000 // 15 seconds timeout
    });

    console.log('RSS feed fetched successfully, parsing XML...');
    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    // Check if there are items
    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      console.log('No items found in RSS feed.');
      // Save empty array
      fs.writeFileSync(
        path.join(dataDir, 'letterboxd.json'),
        JSON.stringify([], null, 2)
      );
      console.log('Saved empty array to letterboxd.json');
      return;
    }

    // Process and filter the data
    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : result.rss.channel.item ? [result.rss.channel.item] : [];
      
    console.log(`Found ${items.length} items in RSS feed`);

    // Filter for diary entries (watched films)
    const watchedFilms = items
      .filter(item => {
        // Make sure it's a watched film
        const isWatched = item.description && typeof item.description === 'string' && 
                         (item.description.includes('watched') || item.description.includes('rewatched'));
        if (isWatched) {
          console.log(`Found watched film: ${item.title}`);
        }
        return isWatched;
      })
      .map(item => {
        try {
          // Extract film title
          const title = item.title.split(' - ')[0].trim();
          
          // Extract poster URL
          let posterUrl = '';
          const posterMatch = item.description.match(/<img src="([^"]+)"/);
          if (posterMatch && posterMatch[1]) {
            posterUrl = posterMatch[1];
          }
          
          // Extract rating
          let rating = 0;
          const ratingMatch = item.description.match(/(\d+(?:\.\d+)?)-star/);
          if (ratingMatch && ratingMatch[1]) {
            rating = parseFloat(ratingMatch[1]);
          }
          
          return {
            title,
            link: item.link,
            watchDate: item.pubDate,
            posterUrl,
            rating
          };
        } catch (error) {
          console.error('Error processing item:', error);
          return null;
        }
      })
      .filter(item => item !== null)
      .slice(0, 12); // Limit to 12 most recent films
    
    console.log(`Processed ${watchedFilms.length} watched films`);

    // Save processed data to JSON file
    fs.writeFileSync(
      path.join(dataDir, 'letterboxd.json'),
      JSON.stringify(watchedFilms, null, 2)
    );

    console.log(`Successfully fetched and saved ${watchedFilms.length} films`);
  } catch (error) {
    console.error('Error fetching Letterboxd data:', error.message);
    
    // Make sure data directory exists even after error
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save empty array 
    fs.writeFileSync(
      path.join(dataDir, 'letterboxd.json'),
      JSON.stringify([], null, 2)
    );
    
    console.error('Saved empty array to letterboxd.json due to error');
    process.exit(1);
  }
}

// Run the fetch function
fetchLetterboxdData();