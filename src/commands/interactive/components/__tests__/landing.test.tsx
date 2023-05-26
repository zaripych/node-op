import { expect, it } from '@jest/globals';
import React from 'react';

const loadInkTestingLibraryWithDisabledColors = async () => {
  process.env['FORCE_COLOR'] = '0';
  const { render } = await import('ink-testing-library');
  const { Text } = await import('ink');
  const { Landing } = await import('../landing');
  return { render, Text, Landing };
};

const { render, Text, Landing } =
  await loadInkTestingLibraryWithDisabledColors();

type Deps = typeof Landing.defaultDeps;

const buildDeps = ({
  landingState,
  ...deps
}: Partial<Deps> & {
  landingState?: Partial<ReturnType<Deps['useLandingState']>>;
}) => ({
  useLandingState: () => ({
    itemsRequest: { status: 'initial' as const },
    loginRequest: { status: 'initial' as const },
    screen: 'search' as const,
    screenSize: undefined,
    ...landingState,
  }),
  ItemDetails: () => <Text>[details]</Text>,
  SearchItems: () => <Text>[search]</Text>,
  ...deps,
});

it('should render when nothing is mocked', () => {
  const landing = render(<Landing />);
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should render the landing page as empty initially', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          itemsRequest: { status: 'initial' },
          loginRequest: { status: 'initial' },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should render items in-progress state', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          itemsRequest: { status: 'started' },
          loginRequest: { status: 'initial' },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "⠋ Loading 1-Password items",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should not render login in-progress state, because logging in requires stdin/out to be clean', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          itemsRequest: { status: 'initial' },
          loginRequest: { status: 'started' },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should render when items loading failed', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          itemsRequest: {
            status: 'failed',
            error: {
              message: 'Error: Something went wrong',
              details: '  at here.or.there (file.js:1:1)',
            },
          },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "Error: Something went wrong
        at here.or.there (file.js:1:1)",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should render when login failed', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          loginRequest: {
            status: 'failed',
            error: {
              message: 'Error: Something went wrong',
              details: '  at here.or.there (file.js:1:1)',
            },
          },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "Error: Something went wrong
        at here.or.there (file.js:1:1)
      Failed to login, type your password and press Enter to try again:
      ",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should render when items loaded nothing', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          itemsRequest: {
            status: 'success',
            data: [],
          },
          loginRequest: { status: 'started' },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "1-Password vault seem to be empty",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});

it('should render [search] component when items loaded a few items', () => {
  const landing = render(
    <Landing
      deps={buildDeps({
        landingState: {
          itemsRequest: {
            status: 'success',
            data: [
              {
                uuid: '123',
                title: 'My Item',
                type: 'login',
                createdAt: new Date('2020-01-01').toString(),
                updatedAt: new Date('2020-01-01').toString(),
                description: 'My description',
                urlHost: 'example.com',
              },
            ],
          },
        },
      })}
    />
  );
  try {
    expect(landing.frames).toMatchInlineSnapshot(`
      [
        "[search]",
      ]
    `);
  } finally {
    landing.unmount();
    landing.cleanup();
  }
});
