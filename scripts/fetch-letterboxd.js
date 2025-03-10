const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Function to fetch Letterboxd RSS feed
async function fetchLetterboxdData() {
  try {
    // Fetch RSS feed
    const response = await axios.get('https://letterboxd.com/gianvittorio/rss/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GitHubAction/1.0)'
      }
    });

    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    // Process and filter the data
    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];

    // Filter for diary entries (watched films)
    const watchedFilms = items
      .filter(item => item.description && item.description.includes('watched'))
      .map(item => {
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
      })
      .slice(0, 12); // Limit to 12 most recent films

    // Save processed data to JSON file
    fs.writeFileSync(
      path.join(dataDir, 'letterboxd.json'),
      JSON.stringify(watchedFilms, null, 2)
    );

    console.log(`Successfully fetched and saved ${watchedFilms.length} films`);
  } catch (error) {
    console.error('Error fetching Letterboxd data:', error.message);
    process.exit(1);
  }
}

// Run the fetch function
fetchLetterboxdData();