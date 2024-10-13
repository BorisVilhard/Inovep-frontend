'use client';
import axios from 'axios';
import { useForm, FormProvider, useFieldArray, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Button from '@/app/components/Button/Button';
import { InputField } from '@/app/components/Fields';
import { useEffect } from 'react';
import useStore from '@/views/auth/api/userReponse';
import { useRouter } from 'next/navigation';

const EntrySchema = zod.object({
  title: zod.string(),
  value: zod.union([zod.number(), zod.string()]),
  date: zod.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

const IndexedEntriesSchema = zod.object({
  chartType: zod.enum([
    'EntryArea',
    'IndexArea',
    'EntryLine',
    'IndexLine',
    'TradingLine',
    'IndexBar',
    'Bar',
    'Pie',
    'Line',
    'Radar',
  ]),
  data: zod.array(EntrySchema),
  id: zod.number(),
  isChartTypeChanged: zod.boolean().optional(),
});

const DashboardCategorySchema = zod.object({
  categoryName: zod.string(),
  mainData: zod.array(IndexedEntriesSchema),
  combinedData: zod.array(zod.number()).optional(),
});

const DashboardFormSchema = zod.object({
  dashboardData: zod.array(DashboardCategorySchema),
});

type DashboardFormValues = zod.infer<typeof DashboardFormSchema>;

interface DashboardFormProps {
  dashboardId?: string;
}

const DashboardForm: React.FC<DashboardFormProps> = ({ dashboardId }) => {
  const router = useRouter();
  const { id: userId, accessToken } = useStore();
  console.log('Dashboard ID:', dashboardId);

  const methods = useForm<DashboardFormValues>({
    resolver: zodResolver(DashboardFormSchema),
    defaultValues: {
      dashboardData: [],
    },
  });

  const { control, reset } = methods;

  // Fetch existing dashboard if editing
  useEffect(() => {
    if (dashboardId && userId) {
      axios
        .get<DashboardFormValues>(
          `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .then((response) => {
          const { dashboardData } = response.data;
          // Populate the form with existing data using reset
          reset({
            dashboardData,
          });
        })
        .catch((error) => {
          console.error('Error fetching dashboard:', error);
        });
    }
  }, [dashboardId, userId, reset, accessToken]);

  const handleCreate = async (data: DashboardFormValues) => {
    try {
      const response = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const newDashboard = response.data.dashboard;
      alert('Dashboard created successfully!');
      console.log(newDashboard);
      // Redirect to the newly created dashboard's edit page
      router.push(`/dashboard/${newDashboard._id}`);
    } catch (error) {
      console.error('Error creating dashboard:', error);
      alert('Error creating dashboard');
    }
  };

  const handleUpdate = async (data: DashboardFormValues) => {
    try {
      await axios.put(`http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      alert('Dashboard updated successfully!');
    } catch (error) {
      console.error('Error updating dashboard:', error);
      alert('Error updating dashboard');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      alert('Dashboard deleted successfully!');
      // Optionally, redirect or reset the form
      reset({
        dashboardData: [],
      });
      router.push('/dashboards'); // Redirect to dashboards list page
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      alert('Error deleting dashboard');
    }
  };

  // Field arrays for dynamic form sections
  const {
    fields: dashboardDataFields,
    append: appendDashboardData,
    remove: removeDashboardData,
  } = useFieldArray({
    control,
    name: 'dashboardData',
  });

  const addDashboardData = () => {
    appendDashboardData({ categoryName: '', mainData: [] });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(dashboardId ? handleUpdate : handleCreate)}
        className="m-4 flex flex-col"
      >
        <div className="mt-4 flex flex-col gap-5">
          {/* Render Dashboard Data Sections */}
          {dashboardDataFields.map((dashboardDataItem, index) => (
            <div key={dashboardDataItem.id} className="mb-4 border p-4">
              <h3>Dashboard Category {index + 1}</h3>
              <InputField
                name={`dashboardData.${index}.categoryName`}
                placeholder="Category Name"
              />

              {/* Main Data Field Array */}
              <MainDataFieldArray nestIndex={index} control={control} />

              <Button
                htmlType="button"
                onClick={() => removeDashboardData(index)}
                radius="squared"
                className="mt-2"
              >
                Remove Dashboard Category
              </Button>
            </div>
          ))}

          <Button htmlType="button" onClick={addDashboardData} radius="squared">
            Add Dashboard Category
          </Button>

          <div className="mt-4 flex gap-4">
            <Button htmlType="submit" radius="squared">
              {dashboardId ? 'Update Dashboard' : 'Create Dashboard'}
            </Button>

            {dashboardId && (
              <Button htmlType="button" type="error" onClick={handleDelete} radius="squared">
                Delete Dashboard
              </Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

// MainDataFieldArray Component

interface MainDataFieldArrayProps {
  nestIndex: number;
  control: Control<DashboardFormValues>;
}

const MainDataFieldArray: React.FC<MainDataFieldArrayProps> = ({ nestIndex, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `dashboardData.${nestIndex}.mainData`,
  });

  const addMainData = () => {
    append({
      chartType: 'Bar',
      data: [],
      id: Date.now(),
    });
  };

  return (
    <div>
      <h4>Main Data</h4>
      {fields.map((mainDataItem, k) => (
        <div key={mainDataItem.id} className="mb-2 border p-4">
          <select name={`dashboardData.${nestIndex}.mainData.${k}.chartType`}>
            <option value="">Select Chart Type</option>
            <option value="EntryArea">EntryArea</option>
            <option value="IndexArea">IndexArea</option>
            <option value="EntryLine">EntryLine</option>
            <option value="IndexLine">IndexLine</option>
            <option value="TradingLine">TradingLine</option>
            <option value="IndexBar">IndexBar</option>
            <option value="Bar">Bar</option>
            <option value="Pie">Pie</option>
            <option value="Line">Line</option>
            <option value="Radar">Radar</option>
          </select>

          <DataFieldArray nestIndex={nestIndex} mainDataIndex={k} control={control} />

          <Button htmlType="button" onClick={() => remove(k)} radius="squared" className="mt-2">
            Remove Main Data
          </Button>
        </div>
      ))}
      <Button htmlType="button" onClick={addMainData} radius="squared">
        Add Main Data
      </Button>
    </div>
  );
};

// DataFieldArray Component

interface DataFieldArrayProps {
  nestIndex: number;
  mainDataIndex: number;
  control: Control<DashboardFormValues>;
}

const DataFieldArray: React.FC<DataFieldArrayProps> = ({ nestIndex, mainDataIndex, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `dashboardData.${nestIndex}.mainData.${mainDataIndex}.data`,
  });

  const addData = () => {
    append({ title: '', value: '', date: '' });
  };

  return (
    <div>
      <h5>Data Points</h5>
      {fields.map((dataItem, j) => (
        <div key={dataItem.id} className="mb-1 border p-2">
          <InputField
            name={`dashboardData.${nestIndex}.mainData.${mainDataIndex}.data.${j}.title`}
            placeholder="Title"
          />
          <InputField
            name={`dashboardData.${nestIndex}.mainData.${mainDataIndex}.data.${j}.value`}
            placeholder="Value"
          />
          <InputField
            name={`dashboardData.${nestIndex}.mainData.${mainDataIndex}.data.${j}.date`}
            placeholder="Date"
            type="date"
          />
          <Button htmlType="button" onClick={() => remove(j)} radius="squared" className="mt-1">
            Remove Data Point
          </Button>
        </div>
      ))}
      <Button htmlType="button" onClick={addData} radius="squared">
        Add Data Point
      </Button>
    </div>
  );
};

export default DashboardForm;
