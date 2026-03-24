/**
 * @author Aleksandar Panich
 * @version Assignment02
 *
 * - Contains Express middleware functions used across routes
 * - Provides authentication guards to protect private routes
 * - Redirects unauthenticated users to the login page
 *
 * Step 1: Check if a valid session exists for the request
 * Step 2: Allow the request to proceed or redirect to login
 */

/**
 * Middleware to protect routes that require authentication.
 *
 * - Checks if req.session.user exists
 * - Redirects to /login if user is not authenticated
 * - Calls next() to continue to the route handler if authenticated
 *
 * Step 1: Check session for logged-in user
 * Step 2: Redirect to /login if no session found
 * Step 3: Call next() if session is valid
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

module.exports = { requireLogin };