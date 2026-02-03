'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, message, Card, List } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface Appointment {
  _id: string;
  name: string;
  phone: string;
  extraInfo?: string;
  type: 'visit' | 'accommodate';
  address?: string;
  dateTime: string;
  sessions: number;
}

interface Settings {
  workingDays: string[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchAppointments();
    fetchSettings();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments?admin=true');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      message.error('Failed to fetch appointments');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      message.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (values: any) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('Settings updated successfully');
        setSettingsModalVisible(false);
        fetchSettings();
      } else {
        message.error('Failed to update settings');
      }
    } catch (error) {
      message.error('Failed to update settings');
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/admin/login');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Date & Time',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (dateTime: string) => dayjs(dateTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessions',
      key: 'sessions',
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="space-x-4">
            <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)}>
              Settings
            </Button>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Appointments" className="shadow-md">
            <Table
              columns={columns}
              dataSource={appointments}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Card title="Settings" className="shadow-md">
            {settings && (
              <List>
                <List.Item>
                  <strong>Working Days:</strong> {settings.workingDays.join(', ')}
                </List.Item>
                <List.Item>
                  <strong>Start Time:</strong> {settings.startTime}
                </List.Item>
                <List.Item>
                  <strong>End Time:</strong> {settings.endTime}
                </List.Item>
                <List.Item>
                  <strong>Session Duration:</strong> {settings.sessionDuration} minutes
                </List.Item>
              </List>
            )}
          </Card>
        </div>

        <Modal
          title="Update Settings"
          open={settingsModalVisible}
          onCancel={() => setSettingsModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSettingsUpdate}
            initialValues={settings || {}}
          >
            <Form.Item
              name="workingDays"
              label="Working Days"
              rules={[{ required: true, message: 'Please select working days' }]}
            >
              <Select mode="multiple" placeholder="Select working days">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <Select.Option key={day} value={day}>{day}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item
              name="sessionDuration"
              label="Session Duration (minutes)"
              rules={[{ required: true, message: 'Please enter session duration' }]}
            >
              <Input type="number" min={1} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full">
                Update Settings
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
