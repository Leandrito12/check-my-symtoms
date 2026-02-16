/**
 * Input de filtro por síntoma en el dashboard. Misma apariencia y comportamiento
 * que el dropdown de "agregar síntoma" (escribe, filtra lista, elige), pero solo
 * para definir el filtro y mostrando siempre el valor seleccionado en el input.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { devLog } from '@/src/utils/devLog';
import type { SymptomMaster } from '@/src/domain/types';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;
const DROPDOWN_MAX_HEIGHT = 220;

interface SymptomFilterDropdownProps {
  options: SymptomMaster[];
  value: SymptomMaster | null;
  onChange: (item: SymptomMaster) => void;
  placeholder?: string;
}

export function SymptomFilterDropdown({
  options,
  value,
  onChange,
  placeholder = 'Escribe o elige un síntoma...',
}: SymptomFilterDropdownProps) {
  const [search, setSearch] = useState(value?.name ?? '');
  const [focused, setFocused] = useState(false);
  const prevValueRef = useRef<SymptomMaster | null>(value);

  useEffect(() => {
    devLog('DashboardFilter', 'Prop value recibido', {
      valueName: value?.name ?? null,
      valueId: value?.id ?? null,
    });
    if (value?.name != null) setSearch(value.name);
    else setSearch('');
  }, [value?.name]);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      devLog('DashboardFilter', 'Prop value cambió (padre actualizó)', {
        prev: prevValueRef.current?.name ?? null,
        next: value?.name ?? null,
      });
      prevValueRef.current = value;
    }
  }, [value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const showDropdown = focused && (filtered.length > 0 || search.length > 0);

  /** Cuando hay valor seleccionado y no estamos enfocados, el input muestra siempre value.name. */
  const inputValue = value && !focused ? value.name : search;

  useEffect(() => {
    devLog('DashboardFilter', 'Valor que verá el input (inputValue)', {
      inputValue: inputValue || '(vacío)',
      valueName: value?.name ?? null,
      focused,
      optionsCount: options.length,
    });
  }, [inputValue, value?.name, focused, options.length]);

  const handleSelect = (item: SymptomMaster) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    devLog('DashboardFilter', 'Usuario seleccionó opción de la lista', {
      name: item.name,
      id: item.id,
    });
    onChange(item);
    setSearch(item.name);
    setFocused(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    devLog('DashboardFilter', 'Input recibió foco');
    setFocused(true);
    if (value?.name) setSearch(value.name);
  };

  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlur = () => {
    devLog('DashboardFilter', 'Input perdió foco', { inputValue, valueName: value?.name ?? null });
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      setFocused(false);
    }, 450);
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={SafeHarbor.colors.border}
          value={inputValue}
          onChangeText={setSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable
        />
      </View>
      {showDropdown ? (
        <View style={styles.dropdown} collapsable={false}>
          <ScrollView
            style={styles.dropdownList}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.option}
                activeOpacity={0.7}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 0 },
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
  input: {
    flex: 1,
    fontSize: 16,
    color: SafeHarbor.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
});
