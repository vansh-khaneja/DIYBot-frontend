'use client';

import React, { useState, useEffect } from 'react';


// Types for the declarative UI system
interface UIOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface UIComponent {
  type: string;
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  default_value?: any;
  placeholder?: string;
  disabled?: boolean;
  visible?: boolean;
  validation?: Record<string, any>;
  styling?: Record<string, any>;
  
  // Component-specific properties
  rows?: number;
  max_length?: number;
  min_length?: number;
  pattern?: string;
  options?: UIOption[];
  multiple?: boolean;
  searchable?: boolean;
  max_selections?: number;
  checked_value?: any;
  unchecked_value?: any;
  orientation?: string;
  min_value?: number;
  max_value?: number;
  step?: number;
  precision?: number;
  show_value?: boolean;
  format?: string;
  show_preset_colors?: boolean;
  accept?: string;
  max_file_size?: number;
  max_files?: number;
  min_date?: string;
  max_date?: string;
  text?: string;
  html?: boolean;
  thickness?: number;
  color?: string;
  button_text?: string;
  button_type?: string;
  variant?: string;
  size?: string;
  icon?: string;
  on_value?: any;
  off_value?: any;
}

interface UIGroup {
  name: string;
  label: string;
  description?: string;
  components: UIComponent[];
  collapsible?: boolean;
  collapsed?: boolean;
  styling?: Record<string, any>;
}

interface NodeUIConfig {
  node_id: string;
  node_name: string;
  groups: UIGroup[];
  global_styling?: Record<string, any>;
  layout?: string;
  columns?: number;
}

interface DeclarativeUIRendererProps {
  uiConfig: NodeUIConfig;
  parameters: Record<string, any>;
  onParameterChange: (name: string, value: any) => void;
  nodeTheme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

interface DynamicOptions {
  [key: string]: UIOption[];
}

export default function DeclarativeUIRenderer({
  uiConfig,
  parameters,
  onParameterChange,
  nodeTheme
}: DeclarativeUIRendererProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(uiConfig.groups.filter(g => g.collapsed).map(g => g.name))
  );
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions>({});
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Fetch collections when component mounts or when collection selector is present
  React.useEffect(() => {
    const hasCollectionSelector = uiConfig.groups.some(group =>
      group.components.some(comp => comp.name === 'collection_name')
    );

    if (hasCollectionSelector && !dynamicOptions['collections'] && !loadingOptions.has('collections')) {
      fetchCollections();
    }
  }, [uiConfig.groups]);

  // Track previous service value to detect actual changes
  const [previousService, setPreviousService] = React.useState<string>('');

  const fetchModels = React.useCallback(async (service: string) => {
    const cacheKey = `models_${service}`;
    if (dynamicOptions[cacheKey]) return; // Already fetched

    setLoadingOptions(prev => new Set(prev).add(cacheKey));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/nodes/models/${service}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const models: UIOption[] = data.data.models.map((model: string) => ({
          value: model,
          label: model
        }));

        setDynamicOptions(prev => ({
          ...prev,
          [cacheKey]: models
        }));
      }
    } catch (error) {
      console.error(`Error fetching models for ${service}:`, error);
    } finally {
      setLoadingOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  }, [dynamicOptions]);

  // Fetch models when service changes
  React.useEffect(() => {
    const serviceValue = parameters['service'];
    if (serviceValue && serviceValue !== '') {
      fetchModels(serviceValue);

      // Only reset model when service actually changes (not just when it exists)
      if (serviceValue !== previousService && parameters['model'] && parameters['model'] !== '') {
        const serviceModels = dynamicOptions[`models_${serviceValue}`];

        // Debug: Log what models are available
        console.log(`🔍 [MODEL DEBUG] Service: ${serviceValue}, Available models:`, serviceModels);
        console.log(`🔍 [MODEL DEBUG] Current model: ${parameters['model']}`);
        console.log(`🔍 [MODEL DEBUG] Models loading:`, loadingOptions.has(`models_${serviceValue}`));

        // If models are still loading, don't reset yet - wait for them to load
        if (loadingOptions.has(`models_${serviceValue}`)) {
          console.log(`⏳ [MODEL VALIDATION] Models still loading for ${serviceValue}, keeping current model: ${parameters['model']}`);
          return;
        }

        // If models haven't been fetched yet, don't reset
        if (!serviceModels || serviceModels.length === 0) {
          console.log(`⏳ [MODEL VALIDATION] No models available yet for ${serviceValue}, keeping current model: ${parameters['model']}`);
          return;
        }

        // Check if current model is valid for this service
        const isModelValid = serviceModels.some((option: UIOption) => option.value === parameters['model']);

        console.log(`🔍 [MODEL DEBUG] Is model valid: ${isModelValid}`);

        // Only reset if model is not valid for this service
        if (!isModelValid) {
          onParameterChange('model', '');
          console.log(`🔄 [MODEL RESET] Resetting model because '${parameters['model']}' is not valid for service '${serviceValue}'`);
        } else {
          console.log(`✅ [MODEL VALID] Keeping model '${parameters['model']}' for service '${serviceValue}'`);
        }
      }

      if (serviceValue !== previousService) {
        setPreviousService(serviceValue);
      }
    }
  }, [parameters['service'], parameters['model'], previousService, fetchModels]);


  const fetchCollections = async () => {
    if (dynamicOptions['collections']) return; // Already fetched

    setLoadingOptions(prev => new Set(prev).add('collections'));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/vector-store/collections`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const collections: UIOption[] = data.collections.map((collection: any) => ({
          value: collection.name,
          label: `${collection.name} (${collection.points_count} docs)`
        }));

        setDynamicOptions(prev => ({
          ...prev,
          collections
        }));
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoadingOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete('collections');
        return newSet;
      });
    }
  };

  const renderComponent = (component: UIComponent) => {
    if (!component.visible) return null;

    const value = parameters[component.name] ?? component.default_value;
    const isRequired = component.required;
    const isDisabled = component.disabled;

    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
    }`;

    const inputStyle = {
      backgroundColor: nodeTheme?.backgroundColor || '#1f2937',
      borderColor: nodeTheme?.primaryColor || '#60a5fa',
      color: nodeTheme?.textColor || '#ffffff',
      borderWidth: '1px',
      borderStyle: 'solid'
    } as React.CSSProperties;

    switch (component.type) {
      case 'text_input':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onParameterChange(component.name, e.target.value)}
            placeholder={component.placeholder || `Enter ${component.label}`}
            className={baseClasses}
            style={{
              ...inputStyle,
              outline: 'none',
              borderColor: nodeTheme?.primaryColor || '#3b82f6',
              boxShadow: `0 0 0 2px ${nodeTheme?.primaryColor || '#3b82f6'}40`
            }}
            disabled={isDisabled}
            maxLength={component.max_length}
            minLength={component.min_length}
            pattern={component.pattern}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onParameterChange(component.name, e.target.value)}
            placeholder={component.placeholder || `Enter ${component.label}`}
            className={baseClasses}
            style={inputStyle}
            disabled={isDisabled}
            rows={component.rows || 3}
            maxLength={component.max_length}
            minLength={component.min_length}
          />
        );

      case 'select':
        // Check if this is a collection selector or model selector
        const isCollectionSelector = component.name === 'collection_name';
        const isModelSelector = component.name === 'model';

        let options, loading;
        if (isCollectionSelector) {
          options = dynamicOptions['collections'];
          loading = loadingOptions.has('collections');
        } else if (isModelSelector) {
          const serviceValue = parameters['service'];
          const cacheKey = `models_${serviceValue}`;
          options = serviceValue ? dynamicOptions[cacheKey] : component.options;
          loading = serviceValue ? loadingOptions.has(cacheKey) : false;
        } else {
          options = component.options;
          loading = false;
        }

        return (
          <div className="relative">
            <select
              value={value || ''}
              onChange={(e) => onParameterChange(component.name, e.target.value)}
              className={baseClasses}
              style={inputStyle}
              disabled={isDisabled || loading}
              multiple={component.multiple}
            >
              <option value="">
                {loading 
                  ? (isCollectionSelector ? 'Loading collections...' : 'Loading models...')
                  : (isModelSelector && !parameters['service'] 
                      ? 'Select a service first'
                      : `Select ${component.label}`)
                }
              </option>
              {options?.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
            {loading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: nodeTheme?.primaryColor || '#3b82f6' }}></div>
              </div>
            )}
          </div>
        );

      case 'multi_select':
        return (
          <select
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              onParameterChange(component.name, selectedOptions);
            }}
            className={baseClasses}
            disabled={isDisabled}
            multiple
          >
            {component.options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === component.checked_value}
              onChange={(e) => onParameterChange(component.name, e.target.checked ? component.checked_value : component.unchecked_value)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              disabled={isDisabled}
            />
            <span className="text-gray-300">{component.label}</span>
          </div>
        );

      case 'radio':
        return (
          <div className={`space-y-2 ${component.orientation === 'horizontal' ? 'flex flex-wrap gap-4' : ''}`}>
            {component.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={component.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onParameterChange(component.name, e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  disabled={isDisabled || option.disabled}
                />
                <span className="text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'number_input':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onParameterChange(component.name, parseFloat(e.target.value) || 0)}
            placeholder={component.placeholder || `Enter ${component.label}`}
            className={baseClasses}
            disabled={isDisabled}
            min={component.min_value}
            max={component.max_value}
            step={component.step}
          />
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value || component.min_value || 0}
              onChange={(e) => onParameterChange(component.name, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              disabled={isDisabled}
              min={component.min_value || 0}
              max={component.max_value || 100}
              step={component.step || 1}
            />
            {component.show_value && (
              <div className="text-center text-gray-300 text-sm">
                {value || component.min_value || 0}
              </div>
            )}
          </div>
        );

      case 'color_picker':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onParameterChange(component.name, e.target.value)}
            className="w-full h-10 border border-gray-600 rounded-lg cursor-pointer"
            disabled={isDisabled}
          />
        );

      case 'file_upload':
        return (
          <input
            type="file"
            onChange={(e) => onParameterChange(component.name, e.target.files)}
            className={baseClasses}
            disabled={isDisabled}
            accept={component.accept}
            multiple={component.multiple}
          />
        );

      case 'date_picker':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onParameterChange(component.name, e.target.value)}
            className={baseClasses}
            disabled={isDisabled}
            min={component.min_date}
            max={component.max_date}
          />
        );

      case 'label':
        return (
          <div className="text-gray-300 text-sm" style={{ color: nodeTheme?.textColor || '#d1d5db' }}>
            {component.html ? (
              <div dangerouslySetInnerHTML={{ __html: component.text || '' }} />
            ) : (
              component.text || component.label
            )}
          </div>
        );

      case 'divider':
        return (
          <hr 
            className={`border-gray-600 ${component.orientation === 'vertical' ? 'w-px h-full' : 'w-full'}`}
            style={{ 
              borderWidth: component.thickness || 1,
              borderColor: component.color || '#4b5563'
            }}
          />
        );

      case 'button':
        const buttonClasses = `px-4 py-2 rounded-lg font-medium transition-colors ${
          component.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
          component.variant === 'secondary' ? 'bg-gray-600 hover:bg-gray-700 text-white' :
          component.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
          component.variant === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
          'bg-gray-600 hover:bg-gray-700 text-white'
        } ${
          component.size === 'small' ? 'px-2 py-1 text-sm' :
          component.size === 'large' ? 'px-6 py-3 text-lg' :
          'px-4 py-2'
        }`;
        
        return (
          <button
            type="button"
            className={buttonClasses}
            disabled={isDisabled}
            onClick={() => {
              // Handle button click - could emit events or call callbacks
              console.log(`Button ${component.name} clicked`);
            }}
          >
            {component.icon && <span className="mr-2">{component.icon}</span>}
            {component.button_text || component.label}
          </button>
        );

      case 'toggle':
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value === component.on_value ? 'bg-blue-600' : 'bg-gray-600'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => {
                if (!isDisabled) {
                  onParameterChange(component.name, value === component.on_value ? component.off_value : component.on_value);
                }
              }}
              disabled={isDisabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value === component.on_value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-gray-300">{component.label}</span>
          </div>
        );


      default:
        return (
          <div className="text-red-400 text-sm">
            Unknown component type: {component.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {uiConfig.groups.map((group) => (
        <div key={group.name} className="space-y-4">
          {/* Group Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{group.label}</h3>
              {group.description && (
                <p className="text-gray-400 text-sm">{group.description}</p>
              )}
            </div>
            {group.collapsible && (
              <button
                onClick={() => toggleGroup(group.name)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    collapsedGroups.has(group.name) ? 'rotate-180' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Group Content */}
          {(!group.collapsible || !collapsedGroups.has(group.name)) && (
            <div
              className="space-y-4 p-4 rounded-lg"
              style={{
                backgroundColor: (group.styling?.background as string) || 'transparent',
                border: group.styling?.border ? `1px solid ${group.styling.border}` : 'none',
                borderRadius: group.styling?.border_radius || '8px',
                padding: group.styling?.padding || '16px',
                ...group.styling
              }}
            >
              {group.components.map((component) => (
                <div key={component.name} className="space-y-2">
                  {component.type !== 'label' && component.type !== 'divider' && component.type !== 'button' && (
                    <label
                      className="block text-sm font-medium"
                      style={{
                        color: component.required
                          ? (nodeTheme?.textColor || '#ffffff')
                          : (nodeTheme?.textColor || '#ffffff') + '80'
                      }}
                    >
                      {component.label}
                      {component.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                  )}
                  
                  {renderComponent(component)}
                  
                  {component.description && component.type !== 'label' && (
                    <p
                      className="text-xs"
                      style={{
                        color: (nodeTheme?.textColor || '#ffffff') + '60'
                      }}
                    >
                      {component.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
