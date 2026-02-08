import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  type ListRenderItem,
} from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { SymptomMaster } from '@/src/domain/types';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;

interface SymptomDropdownProps {
  options: SymptomMaster[];
  value: SymptomMaster | null;
  onChange: (item: SymptomMaster) => void;
  onCreateOption?: (name: string) => Promise<SymptomMaster | null>;
  placeholder?: string;
}

export function SymptomDropdown({
  options,
  value,
  onChange,
  onCreateOption,
  placeholder = 'Escribe o selecciona...',
}: SymptomDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

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

  const handleSelect = (item: SymptomMaster) => {
    onChange(item);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name || !onCreateOption) return;
    setCreating(true);
    try {
      const created = await onCreateOption(name);
      if (created) {
        onChange(created);
        setOpen(false);
        setSearch('');
      }
    } finally {
      setCreating(false);
    }
  };

  const renderItem: ListRenderItem<SymptomMaster> = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: pressed ? SafeHarbor.colors.background : SafeHarbor.colors.white },
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.optionText} numberOfLines={1}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[
          styles.trigger,
          open && styles.triggerFocused,
          { minHeight: MIN_TAP },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value ? value.name : placeholder}
        </Text>
        <View style={styles.addIcon}>
          <Text style={styles.addIconText}>+</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              placeholderTextColor={SafeHarbor.colors.border}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                showCreate ? (
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
                ) : null
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
    paddingHorizontal: 14,
    backgroundColor: SafeHarbor.colors.white,
  },
  triggerFocused: {
    borderColor: SafeHarbor.colors.primary,
    borderWidth: 2,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: SafeHarbor.colors.text,
  },
  placeholder: { color: SafeHarbor.colors.border },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SafeHarbor.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    color: SafeHarbor.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: SafeHarbor.colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 16,
    fontSize: 16,
    color: SafeHarbor.colors.text,
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
