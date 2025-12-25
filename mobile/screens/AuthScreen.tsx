import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface AuthScreenProps {
    onLogin?: () => void;
    onRegister?: () => void;
}

export default function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
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
                src="https://cdn.lordicon.com/unvzzews.json"
                trigger="loop"
                delay="1500"
                state="in-reveal"
                colors="primary:#ffffff,secondary:#ae7aff,tertiary:#f9c9c0"
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
                <Text style={styles.heading}>Ready when you</Text>
                <Text style={styles.heading}>are</Text>
            </View>

            <View style={styles.authButtons}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Log in</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onRegister}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    authButtons: {
        gap: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
    },
    button: {
        flex: 1,
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
