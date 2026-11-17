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
        targetSdk = 36
        versionCode = 3
        versionName = "0.1.2"
        testInstrumentationRunner = "android.test.InstrumentationTestRunner"
    }

    // Diagnostic install package, separate from any previous ROGOV installation.
    // Production package remains com.rogov.android.
    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".installtest"
            versionNameSuffix = "-test"
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
