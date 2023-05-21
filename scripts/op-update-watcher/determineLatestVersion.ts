import { launch } from 'puppeteer';
import { eq, gt, parse } from 'semver';

export const checkPage =
  'https://app-updates.agilebits.com/product_history/CLI';

const versionRegex = /\d+\.\d+\.\d+(-\d+)?/;
const semVerRegex = /\d+\.\d+\.\d+/;

export async function determineLatestVersion() {
  const headlessChrome = await launch();
  try {
    const page = await headlessChrome.newPage();
    await page.goto(checkPage);

    const versionNumberElements = await page.$$('article > h3');

    const headers = await Promise.all(
      versionNumberElements.map((el) =>
        el.getProperty('textContent').then((p) => p.jsonValue())
      )
    );

    const versions = headers.flatMap((text: string | null) => {
      if (!text) {
        return [];
      }
      const versionResult = versionRegex.exec(text);
      const semVerResult = semVerRegex.exec(text);

      const version = versionResult && versionResult[0];
      const semVer = semVerResult && semVerResult[0] && parse(semVerResult[0]);

      if (!version || !semVer) {
        return [];
      }

      return [
        {
          version,
          semVer,
        },
      ];
    });

    versions.sort((a, b) => {
      if (eq(a.semVer, b.semVer)) {
        return 0;
      } else if (gt(a.semVer, b.semVer)) {
        return -1;
      } else {
        return 1;
      }
    });

    return versions[0];
  } finally {
    await headlessChrome.close();
  }
}

export function semVerFromOpVersion(text: string) {
  const semVerResult = semVerRegex.exec(text);
  return (semVerResult && semVerResult[0]) || null;
}
