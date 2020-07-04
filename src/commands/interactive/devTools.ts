import 'source-map-support/register';
import { create } from 'rxjs-spy';
import { log } from './hooks/log';

const instance = create({
  defaultPlugins: false,
  defaultLogger: {
    log: (...args) => {
      log(...args);
    },
  },
});

instance.log(/.*/, /.*/);
