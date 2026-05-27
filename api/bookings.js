// api/bookings.js
// Vercel Serverless Function: Acts as a secure proxy to protect your Google Sheets Apps Script URL.

export default async function handler(req, res) {
  // Retrieve the secure URL from Vercel's Environment Variables
  const webAppUrl = process.env.GOOGLE_WEB_APP_URL;
  
  if (!webAppUrl) {
    return res.status(500).json({ 
      status: "error", 
      message: "Security Error: GOOGLE_WEB_APP_URL is not configured in Vercel Environment Variables." 
    });
  }
  
  try {
    // 1. Gather all query parameters passed by the client (name, email, date, time, etc.)
    const queryParams = new URLSearchParams(req.query).toString();
    const targetUrl = queryParams ? `${webAppUrl}?${queryParams}` : webAppUrl;
    
    // 2. Fetch the data securely from Google Apps Script (Server-to-Server request)
    const response = await fetch(targetUrl, { 
      method: 'GET'
    });
    
    const data = await response.json();
    
    // 3. Forward the secure response back to the client browser
    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel Secure Proxy Error:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Server Error: Failed to communicate with Google Sheets. Please check environment variables or sheet deployment." 
    });
  }
}
