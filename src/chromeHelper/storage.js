export function createStorageOnChangeHandler(keySet, callback) {
  return function onChangeHandler(changes, ns) {
    let changed = {};
    for (let key of Object.keys(changes)) {
      let storageChange = changes[key];
      let nskey = ns + ':' + key;

      if (keySet.has(nskey)) {
        changed[key] = storageChange.newValue;
      }

      if (__DEV__) {
        console.log('Storage key "%s" in namespace "%s" changed. ' +
                    'Old value was "%s", new value is "%s".', key, ns,
                    storageChange.oldValue, storageChange.newValue);
      }
    }
    callback(changed);
  };
}
