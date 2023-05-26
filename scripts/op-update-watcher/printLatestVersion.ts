import { determineLatestVersion } from './determineLatestVersion.js';

const version = await determineLatestVersion();
console.log(version);
