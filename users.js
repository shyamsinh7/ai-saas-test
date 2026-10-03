import { greet } from './greeting.js';

// Returns a parameterized query (text + values) to look up a user by name.
// The name is passed as a bound value, never interpolated into the SQL.
export function findUserQuery(name) {
  return { text: 'SELECT * FROM users WHERE name = $1', values: [name] };
}

// Adults are 18 or older.
export function isAdult(age) {
  return age >= 18;
}

// Greets a user by name.
export function welcome(name) {
  return greet(name);
}
