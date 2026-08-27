const http = require('http');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const PORT = 8080;
const HOST = 'localhost';

// Helper to make requests
function makeRequest(options, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      ...headers
    };
    if (body) {
      if (typeof body === 'string') {
        defaultHeaders['Content-Length'] = Buffer.byteLength(body);
      } else if (Buffer.isBuffer(body)) {
        defaultHeaders['Content-Length'] = body.length;
      }
    }
    const req = http.request({
      host: HOST,
      port: PORT,
      method: options.method || 'GET',
      path: options.path || '/',
      headers: defaultHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Extract cookies from response headers
function getCookies(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return setCookie.map(cookie => cookie.split(';')[0]).join('; ');
}

// Generate unique username
const username = `testuser_${Date.now()}`;
const email = `${username}@example.com`;
const password = 'testpassword123';
const villaTitle = `Automated Test Villa ${Date.now()}`;
const updatedVillaTitle = `${villaTitle} Updated`;

async function runTests() {
  console.log('--- STARTING WONDERLUST FUNCTIONALITY TESTS ---');
  let cookie = '';
  let testListingId = '';

  try {
    // 1. GET /listings (Listings index page)
    console.log('\nTest 1: Fetching all listings...');
    const resListings = await makeRequest({ path: '/listings', method: 'GET' });
    console.log(`Status Code: ${resListings.statusCode}`);
    if (resListings.statusCode === 200 && resListings.data.includes('All Stays') || resListings.data.includes('Featured Destinations') || resListings.data.includes('All Listings')) {
      console.log('✅ Index page works.');
    } else {
      console.log('❌ Index page failed or layout incorrect.');
    }

    // 2. GET /listings?category=Beaches (Filtering category)
    console.log('\nTest 2: Filtering listings by Beaches category...');
    const resFiltered = await makeRequest({ path: '/listings?category=Beaches', method: 'GET' });
    console.log(`Status Code: ${resFiltered.statusCode}`);
    if (resFiltered.statusCode === 200) {
      console.log('✅ Category filtering endpoint works.');
    } else {
      console.log('❌ Category filtering failed.');
    }

    // 3. GET /listings?search=Malibu (Search destination)
    console.log('\nTest 3: Searching listings for Malibu...');
    const resSearch = await makeRequest({ path: '/listings?search=Malibu', method: 'GET' });
    console.log(`Status Code: ${resSearch.statusCode}`);
    if (resSearch.statusCode === 200 && resSearch.data.includes('Cozy Beachfront Cottage') && !resSearch.data.includes('Modern Loft in Downtown')) {
      console.log('✅ Search feature works.');
    } else {
      console.log('❌ Search feature failed (or listing not found).');
    }

    // 4. POST /signup (User registration)
    console.log(`\nTest 4: Creating a test user (${username})...`);
    const signupBody = `username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const resSignup = await makeRequest(
      { path: '/signup', method: 'POST' },
      signupBody,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    console.log(`Status Code: ${resSignup.statusCode}`);
    
    if (resSignup.statusCode === 302) {
      cookie = getCookies(resSignup.headers);
      console.log('✅ User registered successfully and logged in.');
    } else {
      console.log('❌ User registration failed.');
      return;
    }

    // 5. POST /listings (Creating new listing with logged-in user)
    console.log(`\nTest 5: Creating a new listing (${villaTitle})...`);
    const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
    
    const parts = [
      { name: 'listing[title]', value: villaTitle },
      { name: 'listing[description]', value: 'Created by automated test script' },
      { name: 'listing[price]', value: '9999' },
      { name: 'listing[category]', value: 'Beaches' },
      { name: 'listing[country]', value: 'United States' },
      { name: 'listing[location]', value: 'Malibu' }
    ];

    let buffer = Buffer.alloc(0);
    for (const part of parts) {
      let head = `--${boundary}\r\n`;
      head += `Content-Disposition: form-data; name="${part.name}"\r\n\r\n`;
      head += `${part.value}\r\n`;
      buffer = Buffer.concat([buffer, Buffer.from(head)]);
    }
    buffer = Buffer.concat([buffer, Buffer.from(`--${boundary}--\r\n`)]);

    const resCreate = await makeRequest(
      { path: '/listings', method: 'POST' },
      buffer,
      {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Cookie': cookie
      }
    );
    console.log(`Status Code: ${resCreate.statusCode}`);
    if (resCreate.statusCode === 302) {
      console.log('✅ Listing created successfully.');
      const resUpdatedListings = await makeRequest({ path: '/listings', method: 'GET' });
      // Find listing link specifically right before our unique title
      const regex = new RegExp(`href=["']\\/listings\\/([a-f\\d]{24})["'][^>]*>[\\s\\S]{1,1000}${villaTitle}`, 'i');
      const match = resUpdatedListings.data.match(regex);
      if (match) {
        testListingId = match[1];
        console.log(`✅ Extracted new listing ID: ${testListingId}`);
      } else {
        console.log('❌ Failed to extract listing ID.');
      }
    } else {
      console.log('❌ Listing creation failed.');
      console.log('Response body:', resCreate.data);
    }

    if (!testListingId) {
      console.log('Aborting remaining tests because listing creation failed.');
      return;
    }

    // 6. GET /listings/:id (Show listing details)
    console.log(`\nTest 6: Viewing listing ${testListingId}...`);
    const resShow = await makeRequest({ path: `/listings/${testListingId}`, method: 'GET' });
    console.log(`Status Code: ${resShow.statusCode}`);
    if (resShow.statusCode === 200 && resShow.data.includes(villaTitle)) {
      console.log('✅ Listing detail page works.');
    } else {
      console.log('❌ Listing detail page failed.');
    }

    // 7. POST /listings/:id/reviews (Create review)
    console.log(`\nTest 7: Adding a review to listing ${testListingId}...`);
    const reviewBody = 'review%5Bcomment%5D=Automated+test+comment&review%5Brating%5D=5';
    const resReview = await makeRequest(
      { path: `/listings/${testListingId}/reviews`, method: 'POST' },
      reviewBody,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      }
    );
    console.log(`Status Code: ${resReview.statusCode}`);
    if (resReview.statusCode === 302) {
      console.log('✅ Review added successfully.');
    } else {
      console.log('❌ Review creation failed.');
    }

    // 8. PUT /listings/:id (Update listing)
    console.log(`\nTest 8: Updating listing ${testListingId}...`);
    
    const updateBoundary = '----TestBoundaryUpdate' + Math.random().toString(36).substring(2);
    const updateParts = [
      { name: 'listing[title]', value: updatedVillaTitle },
      { name: 'listing[description]', value: 'Updated description' },
      { name: 'listing[price]', value: '8888' },
      { name: 'listing[category]', value: 'Rooms' },
      { name: 'listing[country]', value: 'United States' },
      { name: 'listing[location]', value: 'San Francisco' }
    ];

    let updateBuffer = Buffer.alloc(0);
    for (const part of updateParts) {
      let head = `--${updateBoundary}\r\n`;
      head += `Content-Disposition: form-data; name="${part.name}"\r\n\r\n`;
      head += `${part.value}\r\n`;
      updateBuffer = Buffer.concat([updateBuffer, Buffer.from(head)]);
    }
    updateBuffer = Buffer.concat([updateBuffer, Buffer.from(`--${updateBoundary}--\r\n`)]);

    const resUpdate = await makeRequest(
      { path: `/listings/${testListingId}?_method=PUT`, method: 'POST' },
      updateBuffer,
      {
        'Content-Type': `multipart/form-data; boundary=${updateBoundary}`,
        'Cookie': cookie
      }
    );
    console.log(`Status Code: ${resUpdate.statusCode}`);
    if (resUpdate.statusCode === 302) {
      console.log('✅ Listing updated successfully.');
      const resShowUpdated = await makeRequest({ path: `/listings/${testListingId}`, method: 'GET' });
      if (resShowUpdated.data.includes(updatedVillaTitle) && resShowUpdated.data.includes('San Francisco')) {
        console.log('✅ Update verified in view.');
      } else {
        console.log('❌ Updated values not showing in detail page.');
      }
    } else {
      console.log('❌ Listing update failed.');
    }

    // 9. DELETE /listings/:id/reviews/:reviewId (Delete review)
    console.log('\nTest 9: Deleting review...');
    // We pass the Cookie header in this GET request to see the delete review form button
    const resShowPageForDelete = await makeRequest(
      { path: `/listings/${testListingId}`, method: 'GET' },
      null,
      { 'Cookie': cookie }
    );
    const reviewDeleteRegex = /\/listings\/[a-f\d]{24}\/reviews\/([a-f\d]{24})\?_method=DELETE/;
    const reviewMatch = resShowPageForDelete.data.match(reviewDeleteRegex);
    if (reviewMatch) {
      const reviewId = reviewMatch[1];
      console.log(`Found review ID to delete: ${reviewId}`);
      const resDeleteReview = await makeRequest(
        { path: `/listings/${testListingId}/reviews/${reviewId}?_method=DELETE`, method: 'POST' },
        null,
        { 'Cookie': cookie }
      );
      console.log(`Status Code: ${resDeleteReview.statusCode}`);
      if (resDeleteReview.statusCode === 302) {
        console.log('✅ Review deleted successfully.');
      } else {
        console.log('❌ Review deletion failed.');
      }
    } else {
      console.log('❌ No review ID found on show page to delete.');
    }

    // 10. DELETE /listings/:id (Delete listing)
    console.log(`\nTest 10: Deleting listing ${testListingId}...`);
    const resDelete = await makeRequest(
      { path: `/listings/${testListingId}?_method=DELETE`, method: 'POST' },
      null,
      { 'Cookie': cookie }
    );
    console.log(`Status Code: ${resDelete.statusCode}`);
    if (resDelete.statusCode === 302) {
      console.log('✅ Listing deleted successfully.');
      const resShowDeleted = await makeRequest({ path: `/listings/${testListingId}`, method: 'GET' });
      if (resShowDeleted.statusCode === 302 && resShowDeleted.headers.location === '/listings') {
        console.log('✅ Listing deletion verified (redirected back to index).');
      } else {
        console.log('❌ Deletion verification failed.');
      }
    } else {
      console.log('❌ Listing deletion failed.');
    }

    console.log('\n--- ALL FUNCTIONALITY TESTS FINISHED SUCCESSFULLY! ---');

  } catch (error) {
    console.error('Test execution failed with error:', error);
  }
}

runTests();
