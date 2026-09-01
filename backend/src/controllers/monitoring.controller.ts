import { Request, Response, NextFunction } from 'express';
import { cloudwatchService } from '../services/cloudwatch.service';

export const getMonitoringOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await cloudwatchService.getMonitoringOverview();
    return res.status(200).json({
      success: true,
      message: 'Monitoring overview retrieved successfully',
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

export const getEC2Monitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await cloudwatchService.getEC2Metrics();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getApiGatewayMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiId = (req.query.apiId as string) || '7k2yo6gy77';
    const data = await cloudwatchService.getApiGatewayMetrics(apiId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLambdaMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const functionName = (req.query.functionName as string) || 'CloudCampus-Health-Function';
    const data = await cloudwatchService.getLambdaMetrics(functionName);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getRDSMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbInstance = (req.query.dbInstance as string) || 'cloudcampus-db';
    const data = await cloudwatchService.getRDSMetrics(dbInstance);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonitoringLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logGroupName = (req.query.logGroup as string) || '/cloudcampus/backend';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const logs = await cloudwatchService.getRecentLogs(logGroupName, limit);
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlarmsMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await cloudwatchService.getCloudWatchAlarms();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
