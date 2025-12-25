import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface OnboardingScreen4Props {
    onNext: () => void;
}

export default function OnboardingScreen4({ onNext }: OnboardingScreen4Props) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: transparent;
                }
            </style>
        </head>
        <body>
            <lord-icon
                id="mainIcon"
                src="https://cdn.lordicon.com/kutvltdu.json"
                trigger="loop"
                delay="2000"
                state="hover-zoom"
                colors="primary:#ffffff,secondary:#000000,tertiary:#ae7aff,quaternary:#f9c9c0,quinary:#ae7aff,senary:#ae7aff,septenary:#b26836"
                style="width:320px;height:320px">
            </lord-icon>
            <script>
                // Start animation immediately - use both load event and timeout for fastest start
                function startAnimation() {
                    const icon = document.getElementById('mainIcon');
                    if (icon && icon.playerInstance) {
                        icon.playerInstance.playFromBeginning();
                    } else if (icon) {
                        // If playerInstance not ready, try again shortly
                        setTimeout(startAnimation, 50);
                    }
                }
                
                // Try to start immediately
                setTimeout(startAnimation, 10);
                
                // Also try on load as backup
                window.addEventListener('load', startAnimation);
            </script>
        </body>
        </html>
    `;

    return (
        <View style={styles.container}>
            <View style={styles.animation}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: htmlContent }}
                    style={styles.webview}
                    scrollEnabled={false}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    backgroundColor="transparent"
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.heading}>Know exactly</Text>
                <Text style={styles.heading}>what to do next</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={onNext} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Get started</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingBottom: 60,
    },
    animation: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    webview: {
        width: 320,
        height: 320,
        backgroundColor: 'transparent',
    },
    content: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    heading: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 44,
    },
    button: {
        backgroundColor: '#A78BFA',
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
});
