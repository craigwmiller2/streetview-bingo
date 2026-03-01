const ADVENTURE_CONFIG = {
    norway: {
        id: "norway",
        name: "Norway",
        center: [62.0, 9.0], // Initial map focus
        zoom: 5,
        levels: [
            {
                id: 1,
                city: "Stavanger",
                coords: [58.969, 5.7331],
                maxDistance: 10000,
                startURL:
                    "https://www.google.com/maps/@58.9699296,5.7429793,3a,75y,316.72h,90t/data=!3m7!1e1!3m5!1sVuJkaM5WAb7J2MhZpTHLjQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DVuJkaM5WAb7J2MhZpTHLjQ%26yaw%3D316.7162220491217!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIyNS4wIKXMDSoASAFQAw%3D%3D",
                req: 13,
                title: "Oil Capital Origins",
                desc: "Start your journey in the coastal heart of the south.",
            },
            {
                id: 2,
                city: "Bergen",
                coords: [60.3913, 5.3221],
                maxDistance: 10000,
                startURL:
                    "https://www.google.com/maps/@60.3880576,5.3151429,3a,75y,334.41h,90t/data=!3m7!1e1!3m5!1sZr00jHV8doxpmFldGh2cQQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DZr00jHV8doxpmFldGh2cQQ%26yaw%3D334.4087351933283!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIyNS4wIKXMDSoASAFQAw%3D%3D",
                req: 13,
                title: "The Seven Mountains",
                desc: "Navigate the rainy, colorful streets of the Hanseatic wharf.",
            },
            {
                id: 3,
                city: "Ålesund",
                coords: [62.4722, 6.1495],
                maxDistance: 10000,
                startURL:
                    "https://www.google.com/maps/@62.4704112,6.1281177,3a,75y,218.43h,90t/data=!3m7!1e1!3m5!1sAdT3ScljqQwiF7vb6Jv8PQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DAdT3ScljqQwiF7vb6Jv8PQ%26yaw%3D218.43471797406588!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIyNS4wIKXMDSoASAFQAw%3D%3D",
                req: 13,
                title: "Art Nouveau Adventure",
                desc: "Hunt for items amidst Norway's most beautiful architecture.",
            },
        ],
    },
};
