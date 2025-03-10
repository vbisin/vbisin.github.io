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
    console.log('Starting Letterboxd data fetch process...');
    console.log('Fetching from RSS URL: https://letterboxd.com/gianvittorio/rss/');
    
    // Fetch RSS feed
    const response = await axios.get('https://letterboxd.com/gianvittorio/rss/', {
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
        path.join(dataDir, 'letterboxd.json'),
        JSON.stringify([], null, 2)
      );
      console.log('Saved empty array to letterboxd.json');
      return;
    }
    
    // Process and filter the data
    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];
      
    console.log(`Found ${items.length} items in RSS feed`);

    // Process all diary entries (all entries are watched films)
    const watchedFilms = items
      .map(item => {
        try {
          // Extract film title from title (remove year and rating)
          let title = item.title || '';
          if (title.includes(',')) {
            title = title.split(',')[0].trim();
          }
          if (title.includes('-')) {
            title = title.split('-')[0].trim();
          }
          
          // Extract poster URL
          let posterUrl = '';
          if (item.description && typeof item.description === 'string') {
            const posterMatch = item.description.match(/<img src="([^"]+)"/);
            if (posterMatch && posterMatch[1]) {
              posterUrl = posterMatch[1];
            }
          }
          
          // Extract rating - first check letterboxd:memberRating field
          let rating = 0;
          if (item['letterboxd:memberRating']) {
            rating = parseFloat(item['letterboxd:memberRating']);
          } else if (item.title && item.title.includes('★')) {
            // Try to extract from title if present (e.g., "Film, 2022 - ★★★½")
            const stars = item.title.match(/★+(?:½)?/);
            if (stars) {
              const fullStars = (stars[0].match(/★/g) || []).length;
              const hasHalf = stars[0].includes('½');
              rating = fullStars + (hasHalf ? 0.5 : 0);
            }
          }
          
          // Get watch date (from letterboxd:watchedDate or pubDate)
          const watchDate = item['letterboxd:watchedDate'] 
            ? new Date(item['letterboxd:watchedDate']).toISOString() 
            : item.pubDate || new Date().toISOString();
            
          return {
            title,
            link: item.link || '',
            watchDate,
            posterUrl,
            rating
          };
        } catch (error) {
          console.error('Error processing item:', error);
          return null;
        }
      })
      .filter(item => item !== null && item.title)
      .slice(0, 12); // Limit to 12 most recent films
    
    console.log(`Processed ${watchedFilms.length} watched films`);

    // Save processed data to JSON file
    fs.writeFileSync(
      path.join(dataDir, 'letterboxd.json'),
      JSON.stringify(watchedFilms, null, 2)
    );

    console.log(`Successfully fetched and saved ${watchedFilms.length} films`);
  } catch (error) {
    console.error('Error fetching Letterboxd data:');
    console.error(error);
    
    // Make sure data directory exists
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