
'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, TimePicker, message, Card, Radio } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface Settings {
  workingDays: string[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function Home() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedDate && settings) {
      fetchAvailableSlots();
      // fetchBookedTimes();
    }
  }, [selectedDate, settings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      message.error('Failed to load settings');
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await fetch(`/api/appointments?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        const slots: TimeSlot[] = data.availableSlots.map((time: string) => ({
          time,
          available: true,
        }));
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Failed to fetch available slots');
      setAvailableSlots([]);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const dateTime = dayjs(`${values.date.format('YYYY-MM-DD')} ${values.time}`);
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          dateTime: dateTime.toISOString(),
        }),
      });

      if (response.ok) {
        message.success('Appointment booked successfully!');
        form.resetFields();
        setSelectedDate(null);
        setAvailableSlots([]);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to book appointment');
      }
    } catch (error) {
      message.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current: Dayjs) => {
    if (!settings) return false;
    const dayOfWeek = current.format('dddd').toLowerCase();
    return !settings.workingDays.includes(dayOfWeek) || current.isBefore(dayjs().startOf('day'));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="mt-2 text-gray-600">Select your preferred date and time</p>
        </div>

        <Card className="shadow-lg">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input placeholder="Your full name" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input placeholder="Your phone number" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Appointment Type"
              rules={[{ required: true, message: 'Please select appointment type' }]}
            >
              <Radio.Group>
                <Radio value="visit">Visit (come to the office)</Radio>
                <Radio value="accommodate">Accommodate (service at your place)</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) =>
                getFieldValue('type') === 'accommodate' ? (
                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true, message: 'Please enter your address' }]}
                  >
                    <Input.TextArea placeholder="Your full address" rows={3} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="extraInfo"
              label="Extra Information"
            >
              <Input.TextArea placeholder="Any additional information" rows={2} />
            </Form.Item>

            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker
                disabledDate={disabledDate}
                onChange={(date) => setSelectedDate(date)}
                className="w-full"
              />
            </Form.Item>

            {selectedDate && availableSlots.length > 0 && (
              <Form.Item
                name="time"
                label="Time"
                rules={[{ required: true, message: 'Please select a time' }]}
              >
                <Select placeholder="Select available time">
                  {availableSlots
                    .filter(slot => slot.available)
                    .map(slot => (
                      <Select.Option key={slot.time} value={slot.time}>
                        {slot.time}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            )}

            {selectedDate && availableSlots.length === 0 && settings && (
              <div className="text-center text-gray-500 mb-4">
                No available slots for this date
              </div>
            )}

            <Form.Item
              name="sessions"
              label="Number of Sessions"
              initialValue={1}
              rules={[{ required: true, message: 'Please select number of sessions' }]}
            >
              <Select>
                {[1, 2, 3, 4, 5].map(num => (
                  <Select.Option key={num} value={num}>
                    {num} session{num > 1 ? 's' : ''}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
                disabled={!selectedDate || availableSlots.filter(s => s.available).length === 0}
              >
                Book Appointment
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
