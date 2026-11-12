import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { colors } from '@/theme';

/** Small pulsing "live" dot. */
export function PulseDot({ size = 9, color = colors.brand }) {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(opacity, { toValue: 0.25, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true })
        ]));
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }} />;
}
