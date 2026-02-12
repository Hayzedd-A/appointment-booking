"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Card,
  List,
  Tag,
  Space,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Appointment {
  _id: string;
  name: string;
  phone: string;
  extraInfo?: string;
  type: "visit" | "accommodate";
  address?: string;
  dateTime: string;
  sessions: number;
  status: "pending" | "completed" | "cancelled";
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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "cancelled"
  >("all");
  const [form] = Form.useForm();
  const router = useRouter();
  const timeFormat = "HH:mm";

  useEffect(() => {
    fetchAppointments();
    fetchSettings();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments?admin=true");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      message.error("Failed to fetch appointments");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      message.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (values: any) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success("Settings updated successfully");
        setSettingsModalVisible(false);
        fetchSettings();
      } else {
        message.error("Failed to update settings");
      }
    } catch (error) {
      message.error("Failed to update settings");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        message.success(`Appointment marked as ${status}`);
        fetchAppointments();
      } else {
        message.error("Failed to update status");
      }
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Date & Time",
      dataIndex: "dateTime",
      key: "dateTime",
      render: (dateTime: string) => dayjs(dateTime).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Sessions",
      dataIndex: "sessions",
      key: "sessions",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "gold";
        if (status === "completed") color = "green";
        if (status === "cancelled") color = "red";
        return (
          <Tag color={color} className="uppercase">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Due In",
      key: "dueIn",
      render: (_: any, record: Appointment) => {
        if (record.status !== "pending") return "-";
        const now = dayjs();
        const appointmentTime = dayjs(record.dateTime);
        const diffHours = appointmentTime.diff(now, "hour");
        const isOverdue = now.isAfter(appointmentTime);

        let color = "text-gray-600";
        if (isOverdue) color = "text-red-600 font-bold";
        else if (diffHours < 24) color = "text-orange-600";

        return <span className={color}>{appointmentTime.fromNow()}</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Appointment) => (
        <div className="flex flex-col gap-2">
          {record.status === "pending" && (
            <>
              <Popconfirm
                title="Mark as completed"
                description="Are you sure you want to mark this appointment as completed?"
                onConfirm={() => handleStatusUpdate(record._id, "completed")}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  ghost
                >
                  Complete
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Cancel appointment"
                description="Are you sure you want to cancel this appointment?"
                onConfirm={() => handleStatusUpdate(record._id, "cancelled")}
                okText="Yes"
                cancelText="No"
              >
                <Button danger size="small" icon={<CloseCircleOutlined />}>
                  Cancel
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ];

  const filteredAppointments = appointments.filter((apt) =>
    statusFilter === "all" ? true : apt.status === statusFilter,
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-9xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="space-x-4">
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsModalVisible(true)}
            >
              Settings
            </Button>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card
            title="Appointments"
            className="shadow-md"
            extra={
              <Select
                defaultValue="all"
                style={{ width: 120 }}
                onChange={setStatusFilter}
              >
                <Select.Option value="all">All</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
              </Select>
            }
          >
            <Table
              scroll={{ x: 1000 }}
              columns={columns}
              dataSource={filteredAppointments}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Card title="Settings" className="shadow-md">
            {settings && (
              <List>
                <List.Item>
                  <strong>Working Days:</strong>{" "}
                  <span className="ml-2 capitalize">
                    {settings.workingDays.join(", ")}
                  </span>
                </List.Item>
                <List.Item>
                  <strong>Start Time:</strong>{" "}
                  <span className="ml-2">{settings?.startTime}</span>
                </List.Item>
                <List.Item>
                  <strong>End Time:</strong>{" "}
                  <span className="ml-2">{settings?.endTime}</span>
                </List.Item>
                <List.Item>
                  <strong>Session Duration:</strong> {settings.sessionDuration}{" "}
                  minutes
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
              rules={[
                { required: true, message: "Please select working days" },
              ]}
            >
              <Select mode="multiple" placeholder="Select working days">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => (
                  <Select.Option key={day} value={day}>
                    {day}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="startTime"
              label="Start Time"
              getValueProps={(value) => ({
                value: value ? dayjs(value, timeFormat) : null,
              })}
              rules={[{ required: true, message: "Please select start time" }]}
            >
              <TimePicker
                format={timeFormat}
                // defaultValue={dayjs(settings?.startTime, timeFormat)}
              />
            </Form.Item>
            <Form.Item
              name="endTime"
              label="End Time"
              getValueProps={(value) => ({
                value: value ? dayjs(value, timeFormat) : null,
              })}
              rules={[{ required: true, message: "Please select end time" }]}
            >
              <TimePicker
                format={timeFormat}
                // defaultValue={dayjs(settings?.endTime, timeFormat)}
              />
            </Form.Item>
            <Form.Item
              name="sessionDuration"
              label="Session Duration (minutes)"
              rules={[
                { required: true, message: "Please enter session duration" },
              ]}
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
