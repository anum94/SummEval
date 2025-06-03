// Checks if localStorage is available in the browser and returns a boolean value by setting and removing a key from localStorage.
export function localStorageAvailable() {
    try {
      const key = '__some_random_key_you_are_not_going_to_use__';
      window.localStorage.setItem(key, key);
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }
  

  // Get an item from localStorage by key and return it or a default value if it doesn't exist.
  export function localStorageGetItem(key, defaultValue = '') {
    const storageAvailable = localStorageAvailable();
  
    let value;
  
    if (storageAvailable) {
      value = localStorage.getItem(key) || defaultValue;
    }
  
    return value;
  }
  