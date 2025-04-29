import os
import json
from pathlib import Path
from jinja2 import Template

def get_media_files(directory):
    """Get all image and video files in a directory."""
    try:
        media_files = []
        for file in os.listdir(directory):
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov')):
                media_files.append(file)
        return sorted(media_files)
    except Exception as e:
        print(f"Error reading directory {directory}: {str(e)}")
        return []

def format_path_for_url(path):
    """Format a path to be URL-friendly."""
    return path.lower().replace(' ', '_')

def generate_html():
    try:
        # Base directory for images
        base_dir = Path('images')
        if not base_dir.exists():
            raise Exception(f"Base directory {base_dir} does not exist")
        
        # Template for the HTML
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Travel - Vittorio Bisin</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    background-color: #E6E6FA;
                    color: #333333;
                }
                .image-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f8f8ff;
                }
                .image-container img {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                }
                .home-link {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    padding: 10px 20px;
                    background-color: white;
                    border-radius: 20px;
                    text-decoration: none;
                    color: #333;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }
                .home-link:hover {
                    transform: translateY(-2px);
                }
            </style>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const container = document.querySelector('.max-w-6xl');
                    
                    // Sort year sections
                    const yearSections = Array.from(container.querySelectorAll('.mb-20')).filter(section => 
                        section.querySelector('h2').textContent.match(/\\d{4}/)
                    );
                    
                    // Sort by year descending
                    yearSections.sort((a, b) => {
                        const yearA = parseInt(a.querySelector('h2').textContent);
                        const yearB = parseInt(b.querySelector('h2').textContent);
                        return yearB - yearA;
                    });
                    
                    // Within each year, sort countries
                    yearSections.forEach(yearSection => {
                        const countrySections = Array.from(yearSection.querySelectorAll('.mb-16'));
                        
                        // Sort countries alphabetically ascending (A to Z)
                        countrySections.sort((a, b) => {
                            const countryA = a.querySelector('h2').textContent.trim();
                            const countryB = b.querySelector('h2').textContent.trim();
                            return countryA.localeCompare(countryB);
                        });
                        
                        // Within each country, sort cities
                        countrySections.forEach(countrySection => {
                            const citySections = Array.from(countrySection.querySelectorAll('.mb-12'));
                            
                            // Sort cities alphabetically ascending (A to Z)
                            citySections.sort((a, b) => {
                                const cityA = a.querySelector('h3').textContent.trim();
                                const cityB = b.querySelector('h3').textContent.trim();
                                return cityA.localeCompare(cityB);
                            });
                            
                            // Reorder cities in the DOM
                            citySections.forEach(section => countrySection.appendChild(section));
                        });
                        
                        // Reorder countries in the DOM
                        countrySections.forEach(section => yearSection.appendChild(section));
                    });
                    
                    // Reorder years in the DOM
                    yearSections.forEach(section => container.appendChild(section));
                });
            </script>
        </head>
        <body>
            <a href="index.html" class="home-link">← Home</a>
            <div class="max-w-6xl mx-auto p-8 bg-purple-50">
                <div class="text-center mb-12">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">Travel</h1>
                </div>

                {% for year in sorted(years.keys(), reverse=True) %}
                <!-- {{ year }} Section -->
                <div class="mb-20">
                    <h2 class="text-3xl font-bold text-gray-800 mb-8">{{ year }}</h2>

                    {% for country in sorted(years[year].keys()) %}
                    <!-- {{ country }} Section -->
                    <div class="mb-16">
                        <h2 class="text-2xl font-semibold text-gray-800 mb-6">{{ country.replace('_', ' ') | title }}</h2>
                        
                        {% for city, media_list in sorted(years[year][country].items()) %}
                        <!-- {{ city }} -->
                        <div class="mb-12">
                            <h3 class="text-xl text-gray-700 mb-4 pl-2 border-l-4 border-purple-300">{{ city.replace('_', ' ') | title }}</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {% for media in media_list %}
                                <div class="overflow-hidden rounded-lg transform transition-transform duration-300 hover:scale-[1.02]">
                                    <div class="image-container h-[450px]">
                                        {% if media.endswith(('.mp4', '.mov')) %}
                                        <video controls class="w-full h-full object-contain">
                                            <source src="images/{{ year }}/{{ country }}/{{ city }}/{{ media }}" type="video/mp4">
                                            Your browser does not support the video tag.
                                        </video>
                                        {% else %}
                                        <img src="images/{{ year }}/{{ country }}/{{ city }}/{{ media }}" alt="{{ media.split('.')[0] }}" loading="lazy">
                                        {% endif %}
                                    </div>
                                </div>
                                {% endfor %}
                            </div>
                        </div>
                        {% endfor %}
                    </div>
                    {% endfor %}
                </div>
                {% endfor %}
            </div>
        </body>
        </html>
        """
        
        # Create template
        template = Template(template_str)
        
        # Build the data structure
        years = {}
        
        # Walk through the directory structure
        print("Starting directory walk...")
        for year_dir in base_dir.iterdir():
            if not year_dir.is_dir() or not year_dir.name.isdigit():
                print(f"Skipping non-year directory: {year_dir}")
                continue
                
            year = year_dir.name
            print(f"Processing year: {year}")
            years[year] = {}
            
            for country_dir in year_dir.iterdir():
                if not country_dir.is_dir():
                    print(f"Skipping non-directory in {year}: {country_dir}")
                    continue
                    
                if country_dir.name.startswith('.'):
                    print(f"Skipping hidden directory: {country_dir}")
                    continue
                    
                country = country_dir.name
                print(f"Processing country: {country}")
                years[year][country] = {}
                
                for city_dir in country_dir.iterdir():
                    if not city_dir.is_dir():
                        print(f"Skipping non-directory in {country}: {city_dir}")
                        continue
                        
                    if city_dir.name.startswith('.'):
                        print(f"Skipping hidden directory: {city_dir}")
                        continue
                        
                    city = city_dir.name
                    print(f"Processing city: {city}")
                    media_files = get_media_files(city_dir)
                    if media_files:
                        years[year][country][city] = media_files
                        print(f"Found {len(media_files)} media files in {city}")
        
        # Generate the HTML
        print("Generating HTML...")
        html_content = template.render(years=years)
        
        # Write to file
        print("Writing to travel.html...")
        with open('travel.html', 'w') as f:
            f.write(html_content)
            
        print("Successfully generated travel.html")
            
    except Exception as e:
        print(f"Error generating HTML: {str(e)}")
        raise

if __name__ == '__main__':
    generate_html() 