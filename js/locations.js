const STARTING_LOCATIONS = [
    {
        name: "Make the Hattamost of It",
        url: "https://www.google.com/maps/@58.9812559,-2.9609023,3a,39.4y,289.12h,71.32t/data=!3m7!1e1!3m5!1saNoxQrchpW1-YuWaPRWlkA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D18.684294337133622%26panoid%3DaNoxQrchpW1-YuWaPRWlkA%26yaw%3D289.1225669101166!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Definitely not David's dad!",
        url: "https://www.google.com/maps/@58.7993655,-3.2026078,3a,18.6y,157.91h,93.27t/data=!3m7!1e1!3m5!1sm7qYEGYAP2GQlqsFEIzxyA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-3.2720151525600585%26panoid%3Dm7qYEGYAP2GQlqsFEIzxyA%26yaw%3D157.90587531277583!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Only graffiti in the village...",
        url: "https://www.google.com/maps/@69.3160879,16.1222765,3a,15.9y,326.2h,87.33t/data=!3m7!1e1!3m5!1sm23Xb0tyJ80iZwNeLDuz_w!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D2.6741440325765495%26panoid%3Dm23Xb0tyJ80iZwNeLDuz_w%26yaw%3D326.2042103430438!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Where it all began...",
        url: "https://www.google.com/maps/@69.3148589,16.1289579,3a,15.5y,250.49h,88.66t/data=!3m7!1e1!3m5!1sfYt1owp6q3CICW6gu9vc8A!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D1.34007729814779%26panoid%3DfYt1owp6q3CICW6gu9vc8A%26yaw%3D250.49411149723252!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Sorry, there's a problem with the lift.",
        url: "https://www.google.com/maps/@58.9632601,-3.2976389,3a,48.9y,278.75h,101.98t/data=!3m7!1e1!3m5!1sAqmn9jUIFhAVm-9AQlqTBg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-11.982755463220002%26panoid%3DAqmn9jUIFhAVm-9AQlqTBg%26yaw%3D278.75363562125756!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Don't get angry, get Angra (do Heroísmo)!",
        url: "https://www.google.com/maps/@38.6699719,-27.252259,3a,35.9y,244.31h,74.53t/data=!3m7!1e1!3m5!1sSvol7SP66Ys72hmun27wvQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D15.46744273784195%26panoid%3DSvol7SP66Ys72hmun27wvQ%26yaw%3D244.30681092168925!7i13312!8i6656?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Watch out Mario! He's right behind you!",
        url: "https://www.google.com/maps/@40.7586728,-73.9853152,3a,15y,341.34h,88.59t/data=!3m7!1e1!3m5!1sBanBwEchMPRTWfc1EgetRA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D1.406442804590398%26panoid%3DBanBwEchMPRTWfc1EgetRA%26yaw%3D341.34118478527444!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Welcome to the winner's circle!",
        url: "https://www.google.com/maps/@43.3792108,-99.8771062,3a,15.5y,169.92h,89.57t/data=!3m7!1e1!3m5!1sGEYyvBQ0DznuMxBau-msPQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0.43243872807173034%26panoid%3DGEYyvBQ0DznuMxBau-msPQ%26yaw%3D169.92160469113577!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Where the hell is Adell?",
        url: "https://www.google.com/maps/@43.6191144,-87.950829,3a,75y,100.79h,99.27t/data=!3m7!1e1!3m5!1sWAyLERk2aJ9EwFIMwhpNBA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-9.270773169806901%26panoid%3DWAyLERk2aJ9EwFIMwhpNBA%26yaw%3D100.79120820012447!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Can ye tell what it is yet?",
        url: "https://www.google.com/maps/@38.1574231,-107.7577414,3a,15.7y,164.05h,86.23t/data=!3m7!1e1!3m5!1sW9X96d3fmU-MSDUJzQCQtw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D3.7667263541697196%26panoid%3DW9X96d3fmU-MSDUJzQCQtw%26yaw%3D164.0506418880548!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "If at Firth you don't succeed, try, try again.",
        url: "https://www.google.com/maps/@43.3047476,-112.1838327,3a,19.1y,14.23h,96.63t/data=!3m7!1e1!3m5!1scUhd9nZApn9Mh1Nehrh6uA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-6.629369935014765%26panoid%3DcUhd9nZApn9Mh1Nehrh6uA%26yaw%3D14.228496195754193!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
        name: "Yes please, yip!",
        url: "https://www.google.com/maps/@57.6913586,-4.1717358,3a,15y,46.14h,91.21t/data=!3m7!1e1!3m5!1s4wWrCyi58WUpEGZu3uu6xw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-1.2136784703891124%26panoid%3D4wWrCyi58WUpEGZu3uu6xw%26yaw%3D46.137554888902784!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
    },
];
