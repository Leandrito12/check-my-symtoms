import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { SymptomMaster } from '@/src/domain/types';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;
const DROPDOWN_MAX_HEIGHT = 220;

interface SymptomDropdownProps {
  options: SymptomMaster[];
  value: SymptomMaster | null;
  onChange: (item: SymptomMaster) => void;
  onCreateOption?: (name: string) => Promise<SymptomMaster | null>;
  placeholder?: string;
  /** Modo "solo agregar": al seleccionar/crear se llama onAdd y se limpia el input (para sub-síntomas). */
  addOnly?: boolean;
  onAdd?: (item: SymptomMaster) => void;
  /** Estado de error/obligatorio no cumplido: borde y aura en color alert. */
  invalid?: boolean;
}

export function SymptomDropdown({
  options,
  value,
  onChange,
  onCreateOption,
  placeholder = 'Escribe o selecciona...',
  addOnly = false,
  onAdd,
  invalid = false,
}: SymptomDropdownProps) {
  const [search, setSearch] = useState(value?.name ?? '');
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!addOnly && value?.name != null) setSearch(value.name);
  }, [addOnly, value?.name]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const showCreate = useMemo(() => {
    const q = search.trim();
    if (!q || !onCreateOption) return false;
    return !options.some((o) => o.name.toLowerCase() === q.toLowerCase());
  }, [search, options, onCreateOption]);

  const showDropdown = focused && (search.length > 0 || filtered.length > 0);

  const handleSelect = (item: SymptomMaster) => {
    if (addOnly && onAdd) {
      onAdd(item);
      setSearch('');
      setFocused(false);
      Keyboard.dismiss();
      return;
    }
    onChange(item);
    setSearch(item.name);
    setFocused(false);
    Keyboard.dismiss();
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name || !onCreateOption) return;
    setCreating(true);
    try {
      const created = await onCreateOption(name);
      if (created) {
        if (addOnly && onAdd) {
          onAdd(created);
          setSearch('');
          setFocused(false);
          Keyboard.dismiss();
          return;
        }
        onChange(created);
        setSearch(created.name);
        setFocused(false);
        Keyboard.dismiss();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          invalid && !focused && styles.inputRowInvalid,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={SafeHarbor.colors.border}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          editable
        />
        <Pressable
          style={[styles.addIcon, showCreate && styles.addIconActive]}
          onPress={handleCreate}
          disabled={!showCreate || creating}
        >
          <Text style={styles.addIconText}>{creating ? '…' : '+'}</Text>
        </Pressable>
      </View>
      {showDropdown ? (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {filtered.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: pressed ? SafeHarbor.colors.background : SafeHarbor.colors.white },
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText} numberOfLines={1}>{item.name}</Text>
              </Pressable>
            ))}
            {showCreate ? (
              <Pressable
                style={({ pressed }) => [
                  styles.createOption,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.createOptionText}>
                  {creating ? 'Agregando...' : `Agregar nuevo: "${search.trim()}"`}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.white,
    minHeight: MIN_TAP,
  },
  inputRowFocused: {
    borderColor: SafeHarbor.colors.primary,
    borderWidth: 2,
  },
  inputRowInvalid: {
    borderColor: SafeHarbor.colors.alert,
    borderWidth: 2,
    backgroundColor: `${SafeHarbor.colors.alert}06`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: SafeHarbor.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SafeHarbor.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    opacity: 0.7,
  },
  addIconActive: {
    backgroundColor: SafeHarbor.colors.secondary,
    opacity: 1,
  },
  addIconText: {
    color: SafeHarbor.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.white,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: DROPDOWN_MAX_HEIGHT,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SafeHarbor.colors.border,
  },
  optionText: {
    fontSize: 16,
    color: SafeHarbor.colors.text,
  },
  createOption: {
    padding: 16,
    alignItems: 'center',
  },
  createOptionText: {
    fontSize: 16,
    color: SafeHarbor.colors.secondary,
    fontWeight: '600',
  },
});
