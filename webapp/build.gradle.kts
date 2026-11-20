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
            // PR-specific test builds sit beside existing WebView installs.
            // Debug signing keys can differ between CI runs; do not force users
            // to uninstall an app containing a saved expedition.
            val qaSuffix = providers.gradleProperty("rogovQaAppSuffix").orNull
            if (!qaSuffix.isNullOrEmpty()) {
                require(Regex("\\.pr[1-9][0-9]*").matches(qaSuffix)) {
                    "QA package suffix must be .pr followed by a positive PR number"
                }
                applicationIdSuffix = qaSuffix
                versionNameSuffix = "-${qaSuffix.drop(1)}"
                manifestPlaceholders["rogovAppLabel"] = "ROGOV TEST PR ${qaSuffix.drop(3)}"
            } else {
                manifestPlaceholders["rogovAppLabel"] = "ROGOV Web QA"
            }
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
    // AssetLoader is supported here without the new jspecify runtime dependency.
    implementation("androidx.webkit:webkit:1.11.0")
}
