-- ============================================================
-- Recalculate total_expenses on project_monitoring_reports
-- Call this after aggregating daily expenses into a report
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_report_totals(p_report_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE project_monitoring_reports
  SET
    total_expenses = (
      material_cost_rental_scaffolds_tools_equipments +
      coil_breakdown + labor_cost + company_outing_13th_month +
      mandatories + equipment_power_tools + compensation_1601c +
      diesel_tollgate_machine_vehicles_registration +
      equipment_vehicle_tools_maintenance_calibration +
      subcon_project_payment_supplier +
      house_rentals_utilities_maintenance +
      surity_bond_commission_others + five_percent_com +
      twelve_percent_vat + uniforms_ppe_medical_medicines_insurance_ids +
      iso_certification + others_meal_pf_load_drawings_seminars_permits_const_fee
    ),
    updated_at = NOW()
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update invoice status automatically based on amounts
-- ============================================================
CREATE OR REPLACE FUNCTION update_invoice_status(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE
  v_amount NUMERIC;
  v_paid   NUMERIC;
  v_due    DATE;
BEGIN
  SELECT amount, amount_paid, due_date
  INTO v_amount, v_paid, v_due
  FROM client_invoices WHERE id = p_invoice_id;

  UPDATE client_invoices SET
    status = CASE
      WHEN v_paid >= v_amount THEN 'paid'
      WHEN v_paid > 0 AND v_paid < v_amount AND v_due < CURRENT_DATE THEN 'overdue'
      WHEN v_paid > 0 AND v_paid < v_amount THEN 'partially_paid'
      WHEN v_due < CURRENT_DATE AND v_paid = 0 THEN 'overdue'
      ELSE 'pending'
    END::invoice_status,
    updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Dashboard aggregate function
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_year INT)
RETURNS TABLE (
  total_expenses_ytd          NUMERIC,
  total_payroll_ytd           NUMERIC,
  active_projects_count       BIGINT,
  total_amount_collected      NUMERIC,
  total_outstanding_balance   NUMERIC,
  total_profit_ytd            NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COALESCE(SUM(cash_out), 0) FROM daily_expenses
     WHERE EXTRACT(YEAR FROM expense_date) = p_year AND deleted_at IS NULL) AS total_expenses_ytd,
    (SELECT COALESCE(SUM(total_payroll), 0) FROM payroll
     WHERE payroll_year = p_year AND deleted_at IS NULL) AS total_payroll_ytd,
    (SELECT COUNT(*) FROM projects WHERE status = 'active' AND deleted_at IS NULL) AS active_projects_count,
    (SELECT COALESCE(SUM(amount_collected), 0) FROM project_monitoring_reports
     WHERE report_year = p_year AND deleted_at IS NULL) AS total_amount_collected,
    (SELECT COALESCE(SUM(balance_to_be_collected), 0) FROM project_monitoring_reports
     WHERE report_year = p_year AND deleted_at IS NULL) AS total_outstanding_balance,
    (SELECT COALESCE(SUM(profit), 0) FROM project_monitoring_reports
     WHERE report_year = p_year AND deleted_at IS NULL) AS total_profit_ytd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Monthly expense breakdown for chart
CREATE OR REPLACE FUNCTION get_monthly_expenses(p_year INT)
RETURNS TABLE (month_num INT, month_name TEXT, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(MONTH FROM expense_date)::INT AS month_num,
    TO_CHAR(expense_date, 'Mon') AS month_name,
    COALESCE(SUM(cash_out), 0) AS total
  FROM daily_expenses
  WHERE EXTRACT(YEAR FROM expense_date) = p_year AND deleted_at IS NULL
  GROUP BY EXTRACT(MONTH FROM expense_date), TO_CHAR(expense_date, 'Mon')
  ORDER BY month_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
