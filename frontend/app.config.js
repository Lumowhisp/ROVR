module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: googleMapsApiKey || undefined,
      },
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocationWhenInUseUsageDescription:
          'ROVR needs access to your location to track workout routes and progress.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'ROVR needs access to your location to track workout routes in the background.',
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey || undefined,
        },
      },
      permissions: [
        ...(config.android?.permissions || []),
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
      ],
    },
    plugins: [
      ...(config.plugins || []),
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'ROVR needs access to your location to track workout routes and progress.',
          locationAlwaysAndWhenInUsePermission:
            'ROVR needs access to your location to track workout routes in the background.',
        },
      ],
    ],
  };
};
