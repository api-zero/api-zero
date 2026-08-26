import { api } from "./create-client";

// Set once; every later request carries it.
api.setAuthToken("a-jwt-token");

// Basic auth is base64-encoded for you.
api.setBasicAuth("username", "password");

// On sign-out.
api.clearAuth();
