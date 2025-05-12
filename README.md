# East of Meaning

A contemplative space for dream interpretation inspired by Eastern philosophy, built with simplicity and stillness in mind.

## About

East of Meaning is a static HTML website that offers dream interpretation with an Eastern philosophical perspective. The site embraces minimalism, using only HTML, CSS, and minimal JavaScript for the AI dream interpretation feature.

## Project Structure

```
eastofmeaning/
├── index.html         # Homepage with dream oracle
├── journal/           # Articles directory
│   ├── snake.html     # Dream of snakes article
│   ├── ex.html        # Dreams about ex-partners article 
│   └── water.html     # Water in dreams article
└── README.md          # Project documentation
```

## Features

- **Dream Oracle**: Enter your dream and receive an interpretation inspired by Eastern philosophy
- **Journal Articles**: Contemplative writings about common dream symbols
- **Minimalist Design**: Clean, distraction-free reading experience
- **Eastern Aesthetic**: Visual design and content inspired by Eastern philosophical traditions

## Technical Implementation

- Pure HTML5, CSS3, and vanilla JavaScript
- No frameworks, libraries or dependencies
- Responsive design for all devices
- Embedded SVG for subtle background pattern
- OpenAI API integration (disabled in demo mode)

## Deployment

This is a static website that can be deployed on any static hosting service:

1. **GitHub Pages**:
   - Push the repository to GitHub
   - Enable GitHub Pages in repository settings

2. **Netlify**:
   - Connect your GitHub repository
   - Set the build command to `echo "No build required"` (or leave empty)
   - Set the publish directory to the root folder

3. **Vercel**:
   - Import from Git repository
   - Configure as a static site

## OpenAI Integration

The demo site uses simulated AI responses. To enable actual OpenAI integration:

1. Sign up for an OpenAI API key
2. Replace the simulated function in `index.html` with the commented API call code
3. Add your API key where indicated

## Contact

For questions or feedback: eastofmeaning@gmail.com

## Structure Overview

The website uses a shared CSS file for common elements:

- `css/styles.css` - Contains all shared styles (navigation, search, footer, etc.)

## How to Use the Shared CSS

To use the shared styles in a new page:

1. Include the stylesheet in the `<head>` section:
   ```html
   <link rel="stylesheet" href="css/styles.css">
   ```
   (Adjust path if needed for pages in subdirectories, e.g., `../css/styles.css`)

2. Only add page-specific styles in the `<style>` tag.

3. Use the standard HTML structure for consistent elements:
   ```html
   <nav>
     <a href="index.html" class="logo">eastofmeaning</a>
     <div class="nav-links">
       <a href="#dream-oracle">INTERPRET</a>
       <a href="readings.html">READINGS</a>
       <a href="#contact">CONTACT</a>
     </div>
     <!-- Search container -->
   </nav>
   
   <!-- Your content here -->
   
   <footer id="contact">
     <div class="footer-content">
       <div class="support">
         <p>☕️ If these insights brought you clarity or calm, you may offer me tea 🍵</p>
         <a href="https://www.buymeacoffee.com/eastofmeaning" class="buymeacoffee">
           Buy Me a tea
         </a>
       </div>
       <div class="contact-area">
         <p>Want to share a dream or simply speak?<br>
         Write me anytime: <a href="mailto:eastofmeaning@gmail.com">eastofmeaning@gmail.com</a></p>
       </div>
     </div>
   </footer>
   ```

## Modifying Shared Styles

If you need to update the shared styles:

1. Edit `css/styles.css` to change:
   - Navigation styling
   - Footer styling 
   - Search functionality
   - Responsive design
   - Basic layout

2. No need to update individual pages since they inherit the changes.

This approach helps maintain consistency across the site and makes updates easier! 