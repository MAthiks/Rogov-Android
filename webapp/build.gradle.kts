plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.rogov.webapk"
    compileSdk = 36

    defaultConfig {
        // Separate app ID: NEVER silently overwrite COMPAT or its native saves.
        applicationId = "com.rogov.webapk"
        minSdk = 26
        targetSdk = 33
        versionCode = 1
        versionName = "0.7f-qa098a"
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
        }
    }

    // Ship the exact same HTML, ES modules, CSS, SVG and sprites that
    // GitHub Pages deploys. No gameplay fork or network is required.
    sourceSets.getByName("main").assets.srcDir("../docs")
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
    implementation("androidx.webkit:webkit:1.13.0")
}
