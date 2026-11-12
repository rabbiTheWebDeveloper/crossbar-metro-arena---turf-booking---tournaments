import React from 'react';
import { View, ScrollView } from 'react-native';
import { Input, Chip } from '@/components/ui';

/**
 * Free-text input with one-tap suggestions (the app's version of an HTML <datalist>).
 *   options: string[]
 */
export function SuggestInput({ label, value, onChangeText, options = [], placeholder, required, hint }) {
    return (
        <View style={{ gap: 6 }}>
            <Input label={label} required={required} value={value} onChangeText={onChangeText} placeholder={placeholder} hint={hint} />
            {options.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
                    {options.map(option => (
                        <Chip key={option} label={option} selected={option === value} onPress={() => onChangeText(option)} />
                    ))}
                </ScrollView>
            ) : null}
        </View>
    );
}
