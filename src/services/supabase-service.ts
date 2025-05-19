
// Only updating the specific parts with type errors
export const fetchMechanicById = async (id: string): Promise<Mechanic | null> => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      specialization: data.specialization || '',
      address: data.address || '',
      phone: data.phone || '',
      idCardImage: data.id_card_image || '',
      employmentType: (data.employment_type || 'fulltime') as 'fulltime' | 'contractor',
      isActive: data.is_active
    };
  } catch (error) {
    handleError(error, 'fetching mechanic by ID');
    return null;
  }
};

// Add a task to an invoice
export const addTaskToInvoice = async (
  invoiceId: string, 
  task: Task, 
  hourlyRate: number = 85
): Promise<InvoiceItem> => {
  try {
    if (!task.hoursSpent) {
      throw new Error('Task has no hours spent recorded');
    }
    
    const taskPrice = task.price || (task.hoursSpent * hourlyRate);
    
    const newItem = {
      invoice_id: invoiceId,
      type: 'labor' as 'labor' | 'part',
      description: `Labor: ${task.title}`,
      quantity: task.hoursSpent,
      price: task.price ? (taskPrice / task.hoursSpent) : hourlyRate
    };
    
    const { data, error } = await supabase
      .from('invoice_items')
      .insert([newItem])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      type: data.type as 'labor' | 'part',
      description: data.description,
      quantity: data.quantity,
      price: data.price
    };
    
  } catch (error) {
    handleError(error, 'adding task to invoice');
    throw error;
  }
};

// Record new attendance
export const recordAttendanceInDb = async (attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> => {
  try {
    const dbAttendance = {
      mechanic_id: attendanceData.mechanicId,
      date: attendanceData.date,
      check_in: attendanceData.checkIn,
      check_out: attendanceData.checkOut,
      status: attendanceData.status as 'pending' | 'approved' | 'rejected',
      approved_by: attendanceData.approvedBy,
      notes: attendanceData.notes
    };
    
    const { data, error } = await supabase
      .from('attendance')
      .insert([dbAttendance])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      mechanicId: data.mechanic_id,
      date: data.date,
      checkIn: data.check_in,
      checkOut: data.check_out,
      status: data.status as 'pending' | 'approved' | 'rejected',
      approvedBy: data.approved_by,
      notes: data.notes
    };
    
  } catch (error) {
    handleError(error, 'recording attendance');
    throw error;
  }
};
