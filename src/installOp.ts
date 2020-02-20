import { installOnePassword } from './api';

installOnePassword().catch(err => {
  console.error(err);
  process.exit(1);
});
