plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.rogov.android"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rogov.android"
        minSdk = 26
        targetSdk = 33
        versionCode = 4
        versionName = "0.1.3"
        testInstrumentationRunner = "android.test.InstrumentationTestRunner"
    }

    signingConfigs {
        getByName("debug") {
            enableV1Signing = true
            enableV2Signing = true
        }
    }

    buildTypes {
        getByName("debug") {
            // Distinct diagnostic package: does not replace a prior ROGOV build.
            applicationIdSuffix = ".compat"
            versionNameSuffix = "-compat"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
