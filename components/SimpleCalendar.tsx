import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SimpleCalendarProps {
  markedDates: { [key: string]: any };
  onDayPress?: (day: string) => void;
}

export default function SimpleCalendar({ markedDates, onDayPress }: SimpleCalendarProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const renderDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isMarked = markedDates[dateString];
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      const isTodayAndMarked = isToday && isMarked;
      
      days.push(
        <Pressable
          key={day}
          style={[
            styles.dayCell,
            isTodayAndMarked && styles.todayMarkedCell,
            isToday && !isMarked && styles.todayCell,
            isMarked && !isToday && styles.markedCell
          ]}
          onPress={() => onDayPress?.(dateString)}
        >
          <Text style={[
            styles.dayText,
            isTodayAndMarked && styles.todayMarkedText,
            isToday && !isMarked && styles.todayText,
            isMarked && !isToday && styles.markedText
          ]}>
            {day}
          </Text>
        </Pressable>
      );
    }
    
    return days;
  };
  
  return (
    <View style={styles.calendar}>
      <Text style={styles.monthTitle}>
        {monthNames[currentMonth]} {currentYear}
      </Text>
      
      <View style={styles.dayNamesRow}>
        {dayNames.map(dayName => (
          <Text key={dayName} style={styles.dayName}>
            {dayName}
          </Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {renderDays()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 16,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 1,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 20,
  },
  todayCell: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  todayMarkedCell: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  todayMarkedText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  markedCell: {
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  markedText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
});
