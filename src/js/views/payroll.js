import React, { useState, useEffect, useContext } from "react";
import Flux from "@4geeksacademy/react-flux-dash";
import PropTypes from 'prop-types';
import { store, search, update, fetchSingle, searchMe, processPendingPayrollPeriods, updatePayments, createPayment, fetchAllMe, fetchTemporal, remove, create, fetchPeyrollPeriodPayments } from '../actions.js';
import { GET } from '../utils/api_wrapper';


import DateTime from 'react-datetime';
import moment from 'moment';
import { DATETIME_FORMAT, TIME_FORMAT, NOW, TODAY, haversineDistance } from '../components/utils.js';
import Select from 'react-select';

import { Notify } from 'bc-react-notifier';

import { Shift, EditOrAddShift } from './shifts.js';
import { Employer } from './profile.js';
import { ManageLocations, AddOrEditLocation, Location } from './locations.js';
import { EmployeeExtendedCard, ShiftOption, ShiftCard, DeductionExtendedCard, Theme, Button, ShiftOptionSelected, GenericCard, SearchCatalogSelect, Avatar, Toggle, Wizard, StarRating, ListCard } from '../components/index';
import queryString from 'query-string';

import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';

import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';

import GoogleMapReact from 'google-map-react';

import { PDFDownloadLink } from '@react-pdf/renderer';

import TextareaAutosize from 'react-textarea-autosize';
import {PayrollPeriodReport} from "./reports/index.js";

import { Redirect } from 'react-router-dom';

const ENTITIY_NAME = 'payroll';

//gets the querystring and creats a formData object to be used when opening the rightbar
export const getPayrollInitialFilters = (catalog) => {
    let query = queryString.parse(window.location.search);
    if (typeof query == 'undefined') return {
        starting_at: TODAY(),
        ending_at: new Date().setDate(TODAY().getDate() - 7)
    };
    return {
        starting_at: query.starting_at,
        ending_at: query.ending_at
    };
};

export const Clockin = (data) => {

    const _defaults = {
        author: null,
        employee: null,
        shift: null,
        created_at: null,
        updated_at: null,
        started_at: TODAY(),
        ended_at: TODAY(),
        distance_in_miles: 0,
        distance_out_miles: 0,
        latitude: [],
        longitude: [],
        status: 'PENDING',
        serialize: function () {

            const newObj = {
                shift: (!this.shift || typeof this.shift.id === 'undefined') ? this.shift : this.shift.id,
                employee: (!this.employee || typeof this.employee.id === 'undefined') ? this.employee : this.employee.id
            };

            return Object.assign(this, newObj);
        },
        unserialize: function () {
            const dataType = typeof this.started_at;
            //if its already serialized
            if ((typeof this.shift == 'object') && ['number', 'string'].indexOf(dataType) == -1) return this;

            const newObject = {
                shift: (typeof this.shift != 'object') ? store.get('shift', this.shift) : Shift(this.shift).defaults().unserialize(),
                employee: (typeof this.employee != 'object') ? store.get('employees', this.employee) : this.employee,
                started_at: this.started_at && !moment.isMoment(this.started_at) ? moment(this.started_at) : this.started_at,
                ended_at: this.ended_at && !moment.isMoment(this.ended_at) ? moment(this.ended_at) : this.ended_at,
                latitude_in: parseFloat(this.latitude_in),
                longitude_in: parseFloat(this.longitude_in),
                latitude_out: parseFloat(this.latitude_out),
                longitude_out: parseFloat(this.longitude_out),
                distance_in_miles: parseFloat(this.distance_in_miles),
                distance_out_miles: parseFloat(this.distance_out_miles)
            };

            return Object.assign(this, newObject);
        }

    };

    let _checkin = Object.assign(_defaults, data);
    return {
        get: () => {
            return _checkin;
        },
        validate: () => {
            const start = _checkin.stared_at;
            const finish = _checkin.ended_at;

            //if(SHIFT_POSSIBLE_STATUS.indexOf(_shift.status) == -1) throw new Error('Invalid status "'+_shift.status+'" for shift');

            return _checkin;
        },
        defaults: () => {
            return _defaults;
        },
        getFormData: () => {
            const _formCheckin = {
                id: _checkin.id.toString()
            };
            return _formCheckin;
        }
    };
};

export const PayrollPeriod = (data) => {

    const _defaults = {
        employer: null,
        id: null,
        length: 0,
        length_type: "DAYS",
        payments: [],
        starting_at: null,
        status: null,
        serialize: function () {

            const newObj = {
                employer: (!this.employer || typeof this.employer.id === 'undefined') ? this.employer : this.employer.id
            };

            return Object.assign(this, newObj);
        },
        unserialize: function () {
            const newObject = {
                //shift: (typeof this.shift != 'object') ? store.get('shift', this.shift) : Shift(this.shift).defaults().unserialize(),
            };

            return Object.assign(this, newObject);
        }

    };

    let _payment = Object.assign(_defaults, data);
    return {
        get: () => {
            return _payment;
        },
        validate: () => {
            const start = _payment.starting_at;
            const finish = _payment.ending_at;

            //if(SHIFT_POSSIBLE_STATUS.indexOf(_shift.status) == -1) throw new Error('Invalid status "'+_shift.status+'" for shift');

            return _payment;
        },
        defaults: () => {
            return _defaults;
        },
        getFormData: () => {
            const _formCheckin = {
                id: _payment.id.toString()
            };
            return _formCheckin;
        }
    };
};

export const Payment = (data) => {

    const _defaults = {
        //employer: null,
        //id: null,
        serialize: function () {

            const newObj = {
                id: this.id,
                regular_hours: this.regular_hours,
                over_time: this.over_time,
                hourly_rate: this.hourly_rate,
                total_amount: this.total_amount,
                breaktime_minutes: 0,
                status: this.status,
                splited_payment: this.splited_payment,
                payroll_period: (!this.employer || typeof this.employer.id === 'undefined') ? this.employer : this.employer.id,
                employer: (!this.employer || typeof this.employer.id === 'undefined') ? this.employer : this.employer.id,
                employee: (!this.employee || typeof this.employee.id === 'undefined') ? this.employee : this.employee.id,
                shift: (!this.shift || typeof this.shift.id === 'undefined') ? this.shift : this.shift.id,
                clockin: (!this.clockin || typeof this.clockin.id === 'undefined') ? this.clockin : this.clockin.id
            };

            return Object.assign(this, newObj);
        },
        unserialize: function () {
            const newObject = {
                //shift: (typeof this.shift != 'object') ? store.get('shift', this.shift) : Shift(this.shift).defaults().unserialize(),
                created_at: this.created_at && !moment.isMoment(this.created_at) ? moment(this.created_at) : this.created_at,
                updated_at: this.updated_at && !moment.isMoment(this.updated_at) ? moment(this.updated_at) : this.updated_at
            };


            return Object.assign(this, newObject);
        }

    };

    let _payment = Object.assign(_defaults, data);
    return {
        get: () => {
            return _payment;
        },
        validate: () => {
            //if(SHIFT_POSSIBLE_STATUS.indexOf(_shift.status) == -1) throw new Error('Invalid status "'+_shift.status+'" for shift');
            return _payment;
        },
        defaults: () => {
            return _defaults;
        },
        getFormData: () => {
            const _form = {
                id: _payment.id.toString()
            };
            return _form;
        }
    };
};

export class PayrollSettings extends Flux.DashView {

    constructor() {
        super();
        this.state = {
            employer: Employer().defaults(),
            deductions: []
        };
    }

    setEmployer(newEmployer) {
        const employer = Object.assign(this.state.employer, newEmployer);
        this.setState({ employer });
    }

    componentDidMount() {

        const deductions = store.getState('deduction');
        if (!deductions) {
            searchMe('deduction');
        } else {
            this.setState({ deductions });
        }
        fetchTemporal('employers/me', 'current_employer');
        this.subscribe(store, 'current_employer', (employer) => {
            this.setState({ employer });
        });
        this.subscribe(store, 'deduction', (deductions) => {
            this.setState({ deductions });
        });

    }

    render() {

        const autoClockout = this.state.employer.maximum_clockout_delay_minutes == null ? false : true;
        const weekday = this.state.employer.payroll_period_starting_time.isoWeekday();
        let nextDate = this.state.employer.payroll_period_starting_time.clone();
        while (nextDate.isBefore(NOW())) nextDate = nextDate.add(7, 'days');

        return (<Theme.Consumer>
            {({ bar }) =>
                <div className="p-1 listcontents company-payroll-settings">
                    <h1><span id="company_details">Your Payroll Settings</span></h1>
                    <div className="row mt-2">
                        <div className="col-12">
                            <h4>Next payroll will run on {nextDate.format("dddd, MMMM Do YYYY, h:mm a")}</h4>
                        </div>
                    </div>
                    <form>
                        <div className="row mt-2">
                            <div className="col-12">
                                <label className="d-block">When do you want your payroll to run?</label>
                                <span>Every </span>
                                <select className="form-control" style={{ width: "100px", display: "inline-block" }}>
                                    <option>Week</option>
                                </select>
                                <span> starting </span>
                                <select
                                    value={weekday || 1}
                                    className="form-control" style={{ width: "100px", display: "inline-block" }}
                                    onChange={(e) => {
                                        const diff = (e.target.value - weekday);
                                        let newDate = this.state.employer.payroll_period_starting_time.clone().add(diff, 'days');
                                        this.setEmployer({
                                            payroll_period_starting_time: newDate
                                        });
                                    }}
                                >
                                    <option value={1}>Monday{"'s"}</option>
                                    <option value={2}>Tuesday{"'s"}</option>
                                    <option value={3}>Wednesday{"'s"}</option>
                                    <option value={4}>Thursday{"'s"}</option>
                                    <option value={5}>Friday{"'s"}</option>
                                    <option value={6}>Saturday{"'s"}</option>
                                    <option value={7}>Sunday{"'s"}</option>
                                </select>
                                <span> at </span>
                                <DateTime
                                    dateFormat={false}
                                    styles={{ width: "100px", display: "inline-block" }}
                                    timeFormat={DATETIME_FORMAT}
                                    timeConstraints={{ minutes: { step: 15 } }}
                                    value={this.state.employer.payroll_period_starting_time}
                                    renderInput={(properties) => {
                                        const { value, ...rest } = properties;
                                        return <input value={value.match(/\d{1,2}:\d{1,2}\s?[ap]m/gm)} {...rest} />;
                                    }}
                                    onChange={(value) => {
                                        const starting = moment(this.state.employer.payroll_period_starting_time.format("MM-DD-YYYY") + " " + value.format("hh:mm a"), "MM-DD-YYYY hh:mm a");
                                        this.setEmployer({ payroll_period_starting_time: starting });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <label className="d-block">When can talents start clocking in?</label>
                                <select
                                    value={this.state.employer.maximum_clockin_delta_minutes}
                                    className="form-control" style={{ width: "100px", display: "inline-block" }}
                                    onChange={(e) => this.setEmployer({ maximum_clockin_delta_minutes: isNaN(e.target.value) ? null : e.target.value, timeclock_warning: true })}
                                >
                                    <option value={5}>5 min</option>
                                    <option value={10}>10 min</option>
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 hour</option>
                                </select>
                                <span> before or after the starting time of the shift</span>
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-12">
                                <label className="d-block">Do you want automatic checkout?</label>
                                <select value={autoClockout} className="form-control" style={{ width: "300px", display: "inline-block" }} onChange={(e) => {
                                    this.setEmployer({ maximum_clockout_delay_minutes: e.target.value == 'true' ? 10 : null, timeclock_warning: true });
                                }}>
                                    <option value={true}>Only if the talent forgets to checkout</option>
                                    <option value={false}>No, leave the shift active until the talent checkouts</option>
                                </select>
                                {!autoClockout ? '' : (
                                    <span>
                                        , wait
                                        <input type="number" style={{ width: "60px" }} className="form-control d-inline-block ml-2 mr-2"
                                            value={this.state.employer.maximum_clockout_delay_minutes}
                                            onChange={(e) => this.setEmployer({ maximum_clockout_delay_minutes: e.target.value, timeclock_warning: true })}
                                        />
                                        min to auto checkout
                                    </span>

                                )
                                }
                            </div>
                        </div>
                        {this.state.employer.timeclock_warning &&
                            <div className="alert alert-warning p-2 mt-3">
                                Apply time clock settings to:
                                <select
                                    value={this.state.employer.retroactive}
                                    className="form-control w-100" style={{ width: "100px", display: "inline-block" }}
                                    onChange={(e) => this.setEmployer({ retroactive: e.target.value === "true" ? true : false })}
                                >
                                    <option value={false}>Only new shifts (from now on)</option>
                                    <option value={true}>All shifts (including previously created)</option>
                                </select>
                            </div>
                        }
                        <div className="row mt-2">
                            <div className="col-12">
                                <label>Deductions</label>
                                <div className="p-1 listcontents">
                                    {this.state.deductions.length > 0
                                        ? <table className="table table-striped payroll-summary">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Deduction</th>
                                                    <th>Status</th>
                                                    <th>Description</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.deductions.map((deduction, i) => (
                                                    <DeductionExtendedCard
                                                        key={i}
                                                        deduction={deduction}
                                                        onEditClick={() => bar.show({
                                                            slug: "update_deduction",
                                                            data: deduction
                                                        })}
                                                        onDelete={() => {
                                                            const noti = Notify.info("Are you sure you want to delete this deduction?", (answer) => {
                                                                if (answer) remove('deduction', deduction);
                                                                noti.remove();
                                                            });
                                                        }}
                                                    >
                                                    </DeductionExtendedCard>
                                                ))}
                                            </tbody>
                                        </table>
                                        : <p>No deductions yet</p>
                                    }
                                </div>
                                <Button
                                    size="small"
                                    onClick={() => bar.show({
                                        slug: "create_deduction",
                                        data: {
                                            name: "",
                                            active: false,
                                            value: null,
                                            description: "",
                                            type: "PERCENTAGE"
                                        }
                                    })}
                                >
                                    Add Deduction
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => update({ path: 'employers/me', event_name: 'current_employer' }, Employer(this.state.employer).validate().serialize())
                                    .catch(e => Notify.error(e.message || e))}
                            >Save Payroll Settings</button>
                        </div>
                    </form>
                </div>}
        </Theme.Consumer>);
    }
}

/**
 * EditOrAddExpiredShift
 */
export const EditOrAddExpiredShift = ({ onSave, onCancel, onChange, catalog, formData, error, oldShift }) => {

    const { bar } = useContext(Theme.Context);

    useEffect(() => {
        const venues = store.getState('venues');
        const favlists = store.getState('favlists');
        if (!venues || !favlists) fetchAllMe(['venues', 'favlists']);
    }, []);
    const expired = moment(formData.starting_at).isBefore(NOW()) || moment(formData.ending_at).isBefore(NOW());

    const validating_minimum = moment(formData.starting_at).isBefore(formData.period_starting);
    const validating_maximum = moment(formData.ending_at).isAfter(formData.period_ending);

    return (
        <form>
            <div className="row">
                <div className="col-12">
                    {formData.hide_warnings === true ? null : (formData.status == 'DRAFT' && !error) ?
                        <div className="alert alert-warning d-inline"><i className="fas fa-exclamation-triangle"></i> This shift is a draft</div>
                        : (formData.status != 'UNDEFINED' && !error) ?
                            <div className="alert alert-success">This shift is published, therefore <strong>it needs to be unpublished</strong> before it can be updated</div>
                            : ''
                    }
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <label>Looking for</label>
                    <Select
                        value={catalog.positions.find((pos) => pos.value == formData.position)}
                        onChange={(selection) => onChange({ position: selection.value.toString(), has_sensitive_updates: true })}
                        options={catalog.positions}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-6">
                    <label>How many?</label>
                    <input type="number" className="form-control"
                        value={formData.maximum_allowed_employees}
                        onChange={(e) => {
                            if (parseInt(e.target.value, 10) > 0) {
                                if (oldShift && oldShift.employees.length > parseInt(e.target.value, 10)) Notify.error(`${oldShift.employees.length} talents are scheduled to work on this shift already, delete scheduled employees first.`);
                                else onChange({ maximum_allowed_employees: e.target.value });
                            }
                        }}
                    />
                </div>
                <div className="col-6">
                    <label>Price / hour</label>
                    <input type="number" className="form-control"
                        value={formData.minimum_hourly_rate}
                        onChange={(e) => onChange({
                            minimum_hourly_rate: e.target.value,
                            has_sensitive_updates: true
                        })}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <label className="mb-1">Dates</label>
                    <div className="input-group">
                        <DateTime
                            timeFormat={false}
                            className="shiftdate-picker"
                            closeOnSelect={true}
                            viewDate={formData.starting_at}
                            value={formData.starting_at}
                            isValidDate={(current) => {
                                return current.isSameOrAfter(moment(formData.period_starting).startOf('day')) && current.isSameOrBefore(moment(formData.period_ending).startOf('day'));
                            }}
                            renderInput={(properties) => {
                                const { value, ...rest } = properties;
                                return <input value={value.match(/\d{2}\/\d{2}\/\d{4}/gm)} {...rest} />;
                            }}
                            onChange={(value) => {


                                const getRealDate = (start, end) => {
                                    if (typeof start == 'string') value = moment(start);

                                    const starting = moment(start.format("MM-DD-YYYY") + " " + start.format("hh:mm a"), "MM-DD-YYYY hh:mm a");
                                    var ending = moment(start.format("MM-DD-YYYY") + " " + end.format("hh:mm a"), "MM-DD-YYYY hh:mm a");

                                    if (typeof starting !== 'undefined' && starting.isValid()) {
                                        if (ending.isBefore(starting)) {
                                            ending = ending.add(1, 'days');
                                        }

                                        return { starting_at: starting, ending_at: ending };
                                    }
                                    return null;
                                };

                                const mainDate = getRealDate(value, formData.ending_at);
                                const multipleDates = !Array.isArray(formData.multiple_dates) ? [] : formData.multiple_dates.map(d => getRealDate(d.starting_at, d.ending_at));
                                onChange({ ...mainDate, multiple_dates: multipleDates, has_sensitive_updates: true });


                            }}


                        />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-6">
                    <label>From</label>
                    <DateTime
                        dateFormat={false}
                        timeFormat={DATETIME_FORMAT}
                        closeOnTab={true}
                        timeConstraints={{ minutes: { step: 15 } }}
                        value={formData.starting_at}
                        renderInput={(properties) => {
                            const { value, ...rest } = properties;
                            return <input value={value.match(/\d{1,2}:\d{1,2}\s?[ap]m/gm)} {...rest} />;
                        }}
                        onChange={(value) => {
                            if (typeof value == 'string') value = moment(value);

                            const getRealDate = (start, end) => {
                                const starting = moment(start.format("MM-DD-YYYY") + " " + value.format("hh:mm a"), "MM-DD-YYYY hh:mm a");
                                var ending = moment(end);
                                if (typeof starting !== 'undefined' && starting.isValid()) {
                                    if (ending.isBefore(starting)) {
                                        ending = ending.add(1, 'days');
                                    }

                                    return { starting_at: starting, ending_at: ending };
                                }
                                return null;
                            };

                            const mainDate = getRealDate(formData.starting_at, formData.ending_at);
                            const multipleDates = !Array.isArray(formData.multiple_dates) ? [] : formData.multiple_dates.map(d => getRealDate(d.starting_at, d.ending_at));
                            onChange({ ...mainDate, multiple_dates: multipleDates, has_sensitive_updates: true });


                        }}
                    />
                </div>
                <div className="col-6">
                    <label>To {(formData.ending_at.isBefore(formData.starting_at)) && "(next day)"}</label>
                    <DateTime
                        className="picker-left"
                        dateFormat={false}
                        timeFormat={DATETIME_FORMAT}
                        timeConstraints={{ minutes: { step: 15 } }}
                        value={formData.ending_at}
                        renderInput={(properties) => {
                            const { value, ...rest } = properties;
                            return <input value={value.match(/\d{1,2}:\d{1,2}\s?[ap]m/gm)} {...rest} />;
                        }}
                        onChange={(value) => {
                            if (typeof value == 'string') value = moment(value);

                            const getRealDate = (start, end) => {

                                const starting = start;
                                var ending = moment(start.format("MM-DD-YYYY") + " " + value.format("hh:mm a"), "MM-DD-YYYY hh:mm a");

                                if (typeof starting !== 'undefined' && starting.isValid()) {
                                    if (ending.isBefore(starting)) {
                                        ending = ending.add(1, 'days');
                                    }

                                    return { starting_at: starting, ending_at: ending };
                                }
                                return null;
                            };

                            const mainDate = getRealDate(formData.starting_at, formData.ending_at);
                            const multipleDates = !Array.isArray(formData.multiple_dates) ? [] : formData.multiple_dates.map(d => getRealDate(d.starting_at, d.ending_at));
                            onChange({ ...mainDate, multiple_dates: multipleDates, has_sensitive_updates: true });

                        }}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <label>Location</label>
                    <Select
                        value={catalog.venues.find((ven) => ven.value == formData.venue)}
                        options={[{ label: "Add a location", value: 'new_venue', component: AddOrEditLocation }].concat(catalog.venues)}
                        onChange={(selection) => {
                            if (selection.value == 'new_venue') bar.show({ slug: "create_location", allowLevels: true });
                            else onChange({ venue: selection.value.toString(), has_sensitive_updates: true });
                        }}
                    />
                </div>
            </div>
            <div className="row mt-3">
                <div className="col-12">
                    <h4>Who was supposed to work on this shift?</h4>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    {/* <label>Search people in JobCore:</label> */}
                    <SearchCatalogSelect
                        isMulti={true}
                        value={formData.employeesToAdd}
                        onChange={(selections) => {
                            onChange({ employeesToAdd: selections });
                        }}
                        searchFunction={(search) => new Promise((resolve, reject) =>
                            GET('catalog/employees?full_name=' + search)
                                .then(talents => resolve([
                                    { label: `${(talents.length == 0) ? 'No one found: ' : ''}` }
                                ].concat(talents)))
                                .catch(error => reject(error))
                        )}
                    />
                </div>
            </div>

            <div className="btn-bar">
                <button type="button" className="btn btn-success"
                    onChange={(value) => {
                        const getRealDate = (start, end) => {
                            if (typeof start == 'string') value = moment(start);

                            const starting = moment(start.format("MM-DD-YYYY") + " " + start.format("hh:mm a"), "MM-DD-YYYY hh:mm a");
                            var ending = moment(start.format("MM-DD-YYYY") + " " + end.format("hh:mm a"), "MM-DD-YYYY hh:mm a");

                            if (typeof starting !== 'undefined' && starting.isValid()) {
                                if (ending.isBefore(starting)) {
                                    ending = ending.add(1, 'days');
                                }

                                return { starting_at: starting, ending_at: ending };
                            }
                            return null;
                        };
                        const mainDate = getRealDate(value, formData.ending_at);
                        onChange({ ...mainDate, has_sensitive_updates: true });
                    }}
                    onClick={() => validating_maximum || validating_minimum ? Notify.error("Cannot create shift before payroll time or after") : onSave({
                        executed_action: 'create_expired_shift',
                        status: 'OPEN'
                    })}>Save and publish</button>
            </div>
        </form>
    );
};
EditOrAddExpiredShift.propTypes = {
    error: PropTypes.string,
    oldShift: PropTypes.object,
    bar: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.object,
    catalog: PropTypes.object //contains the data needed for the form to load
};
EditOrAddExpiredShift.defaultProps = {
    oldShift: null
};
export const ManagePayroll = () => {
    const { bar } = useContext(Theme.Context);

    return (<div className="p-1 listcontents">
        Pick a period
    </div>);
};

export const PayrollPeriodDetails = ({ match, history }) => {
    const [employer, setEmployer] = useState(store.getState('current_employer'));
    const [period, setPeriod] = useState(null);
    const [payments, setPayments] = useState([]);

    const { bar } = useContext(Theme.Context);
    useEffect(() => {
        const employerSub = store.subscribe('current_employer', (employer) => setEmployer(employer));
        if(match.params.period_id !== undefined) fetchSingle("payroll-periods", match.params.period_id).then(_period => {
            setPeriod(_period);
            setPayments(_period.payments);
        });

        const removeHistoryListener = history.listen((data) => {
            const period = /\/payroll\/period\/(\d+)/gm;
            const periodMatches = period.exec(data.pathname);
            if (periodMatches) fetchSingle("payroll-periods", periodMatches[1]).then(_period => {
                setPeriod(_period);
                setPayments(_period.payments);
            });
        });

        return () => {
            employerSub.unsubscribe();
            removeHistoryListener();
        };
    }, []);


    if (!employer || !period) return "Loading...";
    if (!employer.payroll_configured || !moment.isMoment(employer.payroll_period_starting_time)) {
        return <div className="p-1 listcontents text-center">
            <h3>Please setup your payroll settings first.</h3>
            <Button color="success" onClick={() => history.push("/payroll/settings")}>Setup Payroll Settings</Button>
        </div>;
    }

    let groupedPayments = {};
    for(let i = 0; i < payments.length; i++){
        const pay = payments[i];
        if (typeof groupedPayments[pay.employee.id] === 'undefined') {
            groupedPayments[pay.employee.id] = { employee: pay.employee, payments: [] };
        }
        groupedPayments[pay.employee.id].payments.push(pay);
    }
    groupedPayments = Object.keys(groupedPayments).map(id => groupedPayments[id]);
    console.log(payments);
    return <div className="p-1 listcontents">
        <p className="text-right">
            {period.status != "OPEN" ?

                (
                    <div>
                        <Button className="btn btn-info text-left mr-4"  onClick={() => {
                                    update('payroll-periods', Object.assign(period, { status: 'OPEN' })).then(_payment => setPayments(payments.map(_pay => {return {
                                        ..._pay, status: "APPROVED" };
                                    }
                                    )))
                                    .catch(e => Notify.error(e.message || e));
                                    }}>Undo Period
                        </Button>
                        <Button className="btn btn-info" onClick={() => history.push('/payroll/report/' + period.id)}>Take me to the Payroll Report</Button>
                    </div>
                )
                :
                    <Button icon="plus" size="small" onClick={() => {
                        const isOpen = period.payments.find(p => p.status === "NEW");
                        const thereIsAnotherNew = payments.find(item => item.status === 'NEW');

                        if (isOpen) return;
                        if (thereIsAnotherNew) setPayments(payments.map(_pay => {
                            if (_pay.status !== 'NEW') return _pay;
                            else {
                                return {
                                    ..._pay,
                                    payments: _pay.payments.filter(p => p.status == 'NEW')
                                };
                            }
                        }));

                        setPayments(period.payments.concat([Payment({ status: "NEW", employee: { id: 'new' } }).defaults()]));
                        bar.close();
                    }}>Add employee to timesheet</Button>
            }
        </p>
        {groupedPayments.length == 0 ?
            <p>No clockins to review for this period</p>
            :
            groupedPayments.sort((a, b) =>
                a.employee.id === "new" ? -1 :
                    b.employee.id === "new" ? 1 :
                        a.employee.user.last_name.toLowerCase() > b.employee.user.last_name.toLowerCase() ? 1 : -1
            ).map(pay => {
                const total_hours = pay.payments.filter(p => p.status === "APPROVED").reduce((total, { regular_hours, over_time }) => total + Number(regular_hours) + Number(over_time), 0);
                const total_amount = pay.payments.filter(p => p.status === "APPROVED").reduce((total, { regular_hours, over_time, hourly_rate }) => total + (Number(regular_hours) + Number(over_time))*Number(hourly_rate) , 0);
                return <table key={pay.employee.id} className="table table-striped payroll-summary">
                    <thead>
                        <tr>
                            <th>
                                {!pay.employee || pay.employee.id === "new" ?
                                    <SearchCatalogSelect
                                        onChange={(selection) => {
                                            const _alreadyExists = !Array.isArray(payments) ? false : payments.find(p => p.employee.id === selection.value);
                                            if (_alreadyExists) Notify.error(`${selection.label} is already listed on this timesheet`);
                                            else GET('employees/' + selection.value)
                                                .then(emp => {
                                                    setPayments(payments.map(p => {
                                                        if (p.employee.id != "new") return p;
                                                        else return Payment({ status: "NEW", employee: emp }).defaults();
                                                    }));
                                                })
                                                .catch(e => Notify.error(e.message || e));
                                        }}
                                        searchFunction={(search) => new Promise((resolve, reject) =>
                                            GET('catalog/employees?full_name=' + search)
                                                .then(talents => resolve([
                                                    { label: `${(talents.length == 0) ? 'No one found: ' : ''}Invite "${search}" to jobcore`, value: 'invite_talent_to_jobcore' }
                                                ].concat(talents)))
                                                .catch(error => reject(error))
                                        )}
                                    />
                                    :
                                    <EmployeeExtendedCard
                                        className="pr-2"
                                        employee={pay.employee}
                                        showFavlist={false}
                                        hoverEffect={false}
                                        showButtonsOnHover={false}
                                        onClick={() => null}
                                    />
                                }
                            </th>
                            <th>In</th>
                            <th>Out</th>
                            <th>Total</th>
                            <th>Break</th>
                            <th>With <br /> Break</th>
                            <th>Diff</th>
                            <th style={{ minWidth: "80px" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pay.payments.map(p =>
                            <PaymentRow key={p.id}
                                payment={p}
                                period={period}
                                employee={pay.employee}
                                readOnly={p.status !== 'PENDING' && p.status !== 'NEW'}
                                onApprove={(payment) => {
                                    p.status !== 'NEW' ?
                                        update('payment', {
                                            ...payment,
                                            status: "APPROVED",
                                            employee: p.employee.id || p.employee,
                                            shift: (payment.shift) ? payment.shift.id : p.shift.id,
                                            id: p.id
                                        }).then(_payment => setPayments(payments.map(_pay => (_pay.id !== p.id) ? _pay : { ..._pay, status: "APPROVED", over_time: payment.over_time, breaktime_minutes: payment.breaktime_minutes })))
                                        :
                                        create('payment',{
                                            ...payment,
                                            status: "APPROVED",
                                            employee: p.employee.id || p.employee,
                                            shift: (payment.shift) ? payment.shift.id : p.shift.id,
                                            payroll_period: period.id,
                                            id: p.id
                                        }).then(_payment => setPayments(payments.map(_pay => (_pay.id !== payment.id) ? _pay : {
                                            ...payment,
                                            status: "APPROVED",
                                            employee: _pay.employee,
                                            over_time: payment.over_time, breaktime_minutes: payment.breaktime_minutes, hourly_rate: payment.shift.minimum_hourly_rate,
                                            shift: payment.shift,
                                            id: p.id || _pay.id || _payment.id
                                        })));
                                }}
                                onUndo={(payment) => update('payment', {
                                    status: "PENDING",
                                    id: p.id
                                }).then(_payment => setPayments(payments.map(_pay => (_pay.id !== payment.id) ? _pay : { ..._pay, status: "PENDING" })))}
                                onReject={(payment) => {
                                    if (p.id === undefined) setPayments(payments.filter(_pay => _pay.id !== undefined && _pay.id));
                                    else update('payment',{ 
                                        id: p.id, 
                                        status: "REJECTED"
                                    })
                                    .then(_payment => setPayments(payments.map(_pay => (_pay.id !== _payment.id) ? _pay : { ..._pay, status: "REJECTED" })));
                                }}
                            />
                        )}
                        <tr>
                            <td colSpan={5}>
                                {period.status === 'OPEN' && pay.employee.id !== "new" &&
                                    <Button icon="plus" size="small" onClick={() => {
                                        setPayments(payments.concat([Payment({ status: "NEW", employee: pay.employee, regular_hours: "0.00", over_time: "0.00", hourly_rate: "0.00" }).defaults()]));
                                    }}>Add new clockin</Button>
                                }
                            </td>
                            <td colSpan={3} className="text-right">
                                Total: {!isNaN(total_hours) ? Math.round(total_hours * 100) / 100 : 0} hr
                                {!isNaN(total_hours) && Math.round(total_hours * 100) / 100 > 40 ? (
                                    <Tooltip placement="bottom" trigger={['hover']} overlay={<small>This employee has {Math.round((total_hours - 40) * 100) / 100  }hr overtime </small>}>
                                        <i className="fas fa-stopwatch text-danger fa-xs mr-2"></i>
                                    </Tooltip>
                                )
                                : null}
                                <small className="d-block">{!isNaN(total_amount) && !isNaN(total_hours) && Math.round(total_hours * 100) / 100 < 40 ? '$'+Math.round(total_amount * 100) / 100 : null}</small>
                                {!isNaN(total_hours) && Math.round(total_hours * 100) / 100 > 40 ? (
                                    <div>
                                        <small className="d-block">Reg: ${!isNaN(total_amount) ? Math.round(total_amount * 100) / 100 : total_amount}</small>
                                        <small className="d-block">OT: ${((((Math.round(total_amount * 100) / 100)/(Math.round(total_hours * 100) / 100))*0.5)*Math.round((total_hours - 40) * 100) / 100).toFixed(2)}</small>
                                        <small className="d-block">Total: $
                                            {((((Math.round(total_amount * 100) / 100)/(Math.round(total_hours * 100) / 100))*0.5)*Math.round((total_hours - 40) * 100) / 100 + Math.round(total_amount * 100) / 100).toFixed(2)}
                                        </small>
                                    </div>
                                    )
                                : null}

                            </td>
                        </tr>
                    </tbody>
                </table>;
            })}
        <div className="btn-bar text-right">
            {period.status === 'OPEN' ?
                <button type="button" className="btn btn-primary" onClick={() => {
                    const unapproved = [].concat.apply([], payments.find(p => p.status === "PENDING"));

                    // const unapproved = [].concat.apply([], payments.map(p => p.payments)).find(p => p.status === "PENDING");

                    // if (unapproved) Notify.error("There are still some payments that need to be approved or rejected");
                    if (Array.isArray(unapproved) && unapproved.length > 0) Notify.error("There are still some payments that need to be approved or rejected");
                    else if (Array.isArray(payments) && payments.length === 0) Notify.error("There are no clockins to review for this period");
                    // else {history.push('/payroll/rating/' + period.id);} 
                   else update('payroll-periods', Object.assign(period, { status: 'FINALIZED' })).then(res => history.push('/payroll/report/' + period.id))
                                .catch(e => Notify.error(e.message || e));
                                }}>Finalize Period</button>
                                :
                <Button className="btn btn-success" onClick={() => history.push('/payroll/report/' + period.id)}>Take me to the Payroll Report</Button>
            }
        </div>
    </div>;

};

PayrollPeriodDetails.propTypes = {
    history: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
};

function createMapOptions(maps) {
    // next props are exposed at maps
    // "Animation", "ControlPosition", "MapTypeControlStyle", "MapTypeId",
    // "NavigationControlStyle", "ScaleControlStyle", "StrokePosition", "SymbolPath", "ZoomControlStyle",
    // "DirectionsStatus", "DirectionsTravelMode", "DirectionsUnitSystem", "DistanceMatrixStatus",
    // "DistanceMatrixElementStatus", "ElevationStatus", "GeocoderLocationType", "GeocoderStatus", "KmlLayerStatus",
    // "MaxZoomStatus", "StreetViewStatus", "TransitMode", "TransitRoutePreference", "TravelMode", "UnitSystem"
    return {
        zoomControlOptions: {
            position: maps.ControlPosition.RIGHT_CENTER,
            style: maps.ZoomControlStyle.SMALL
        },
        zoomControl: false,
        scaleControl: false,
        fullscreenControl: false,
        mapTypeControl: false
    };
}
const Marker = ({ text, className }) => (<div className={className}><i className="fas fa-map-marker-alt fa-lg"></i></div>);
Marker.propTypes = {
    text: PropTypes.string,
    className: PropTypes.string
};
Marker.defaultProps = {
    className: ""
};

const LatLongClockin = ({ clockin, children, isIn }) => {
    if (!clockin) return null;
    const lat = isIn ? clockin.latitude_in : clockin.latitude_out;
    const lng = isIn ? clockin.longitude_in : clockin.longitude_out;
    const distance = isIn ? clockin.distance_in_miles : clockin.distance_out_miles;
    const time = isIn ? clockin.started_at.format('LT') : clockin.ended_at ? clockin.ended_at.format('LT') : "";

    return <Tooltip placement="right" trigger={['hover']} overlay={
        <div style={{ width: "200px", height: "200px" }} className="p-0 d-inline-block">
            <GoogleMapReact
                bootstrapURLKeys={{ key: process.env.GOOGLE_MAPS_WEB_KEY }}
                defaultCenter={{ lat: 25.7617, lng: -80.1918 }}
                width="100%"
                height="100%"
                center={{ lat, lng }}
                options={createMapOptions}
                defaultZoom={14}
            >
                <Marker
                    lat={lat}
                    lng={lng}
                    text={'Jobcore'}
                />
            </GoogleMapReact>
            <p className={`m-0 p-0 text-center ${distance > 0.2 ? "text-danger" : ""}`}>
                {distance} miles away @ {time}<br /><small>[ {lat}, {lng} ]</small>
            </p>
        </div>
    }>
        {children}
    </Tooltip>;
};

LatLongClockin.propTypes = {
    clockin: PropTypes.object.isRequired,
    isIn: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired
};
LatLongClockin.defaultProps = {
    clockin: null,
    isIn: true,
    children: null
};

const PaymentRow = ({ payment, employee, onApprove, onReject, onUndo, readOnly, period, onChange, selection }) => {
    const { bar } = useContext(Theme.Context);
    if (!employee || employee.id === "new") return <p className="px-3 py-1">⬆ Search an employee from the list above...</p>;

    const [clockin, setClockin] = useState(Clockin(payment.clockin).defaults().unserialize());
    const [shift, setShift] = useState(Shift(payment.shift).defaults().unserialize());
    const [possibleShifts, setPossibleShifts] = useState(null);

    const [breaktime, setBreaktime] = useState(payment.breaktime_minutes);
    
    const approvedClockin = payment.approved_clockin_time ? moment(payment.approved_clockin_time) : clockin.started_at ? clockin.started_at : shift.starting_at;
    const approvedClockout = payment.approved_clockout_time ? moment(payment.approved_clockout_time) : clockin.ended_at ? clockin.ended_at : shift.ending_at;
    const [approvedTimes, setApprovedTimes] = useState({ in: approvedClockin, out: approvedClockout });
    const clockInDuration = moment.duration(approvedTimes.out.diff(approvedTimes.in));
    
    // const clockinHours = !clockInDuration ? 0 : clockin.shift || !readOnly ? Math.round(clockInDuration.asHours() * 100) / 100 : "-";
    const clockinHours = Math.round(clockInDuration.asHours() * 100) / 100;

    const shiftStartTime = shift.starting_at.format('LT');
    const shiftEndTime = shift.ending_at.format('LT');
    const shiftNextDay = shift.ending_at.isBefore(shift.starting_at);

    const shiftDuration = moment.duration(shift.ending_at.diff(shift.starting_at));
    const plannedHours = Math.round(shiftDuration.asHours() * 100) / 100;

    const clockInDurationAfterBreak = clockInDuration.subtract(breaktime, "minute");
    const clockInTotalHoursAfterBreak = !clockInDurationAfterBreak ? 0 : Math.round(clockInDurationAfterBreak.asHours() * 100) / 100;

    const diff = Math.round((Number(clockInTotalHoursAfterBreak) - Number(plannedHours)) * 100) / 100;
    // const overtime = clockInTotalHoursAfterBreak > 40 ? clockInTotalHoursAfterBreak - 40 : 0;
    useEffect(() => {
        let subs = null;
        if (payment.status === "NEW") {
            fetchTemporal(`employers/me/shifts?start=${moment(period.starting_at).format('YYYY-MM-DD')}&end=${moment(period.ending_at).format('YYYY-MM-DD')}&employee=${employee.id}`, "employee-expired-shifts")
                .then((_shifts) => {
                    const _posibleShifts = _shifts.map(s => ({ label: '', value: Shift(s).defaults().unserialize() }));
                    setPossibleShifts(_posibleShifts);
                });
            subs = store.subscribe('employee-expired-shifts', (_shifts) => {
                const _posibleShifts = _shifts.map(s => ({ label: '', value: Shift(s).defaults().unserialize() }));
                    const possible = _posibleShifts.map(item => {
                    const obj = Object.assign({}, item);
                    obj['value']['starting_at'] = moment(item.value.starting_at, "YYYY-MM-DDTHH:mm").local();
                    obj['value']['ending_at'] = moment(item.value.ending_at, "YYYY-MM-DDTHH:mm").local();
                    obj['value']['position'] = item.value.position.label ? {title: item.value.position.label, id: item.value.position.id} : item.value.position;
                    return obj;
                    });
                setPossibleShifts(_posibleShifts);
            });
        }
        return () => {
            if (subs) subs.unsubscribe();
        };

    }, []);

    return <tr id={"paymemt" + payment.id}>
        {
            payment.status === "NEW" ?
                <td>
                    <Select className="select-shifts"
                        value={!possibleShifts ? { label: "Loading talent shifts", value: "loading" } : { value: shift }}
                        components={{ Option: ShiftOption, SingleValue: ShiftOptionSelected({ multi: false }) }}
                        onChange={(selectedOption) => {
                            const _shift = selectedOption.value;
                            if (_shift) {
                                if (_shift == 'new_shift') bar.show({
                                    slug: "create_expired_shift", data: {
                                        employeesToAdd: [{ label: employee.user.first_name + " " + employee.user.last_name, value: employee.id }],
                                        // Dates are in utc so I decided to change it to local time
                                        starting_at: moment(period.starting_at),
                                        ending_at: moment(period.starting_at).add(2, "hours"),
                                        period_starting: moment(period.starting_at),
                                        period_ending: moment(period.ending_at),
                                        shift: _shift,
                                        application_restriction: 'SPECIFIC_PEOPLE'
                                    }
                                });
                                
                                else {
                                    setShift(_shift);
                                    setBreaktime(0);
                                }
                            }
                        }}
                        options={possibleShifts ? [{ label: "Add a shift", value: 'new_shift', component: EditOrAddExpiredShift }].concat(possibleShifts) : [{ label: "Add a shift", value: 'new_shift', component: EditOrAddExpiredShift }]}

                    >
                    </Select>
                </td>
                :
                <td>
                    <div className="shift-details">
                        <p className="p-o m-0">
                            <strong className="shift-date">{shift.starting_at.format('ddd, ll')}</strong>
                        </p>
                        <small className="shift-position text-success">{shift.position.title || shift.position.label}</small> @
                        <small className="shift-location text-primary"> {shift.venue.title}</small>
                    </div>
                    {<div>
                        {
                            (typeof shift.price == 'string') ?
                                (shift.price === '0.0') ? '' : <small className="shift-price"> ${shift.price}</small>
                                :
                                <small className="shift-price"> {shift.price.currencySymbol || '$'}{shift.price.amount || shift.minimum_hourly_rate}</small>
                        }{" "}
                        {clockin && <div className="d-inline-block">
                            {clockin.latitude_in > 0 &&
                                <LatLongClockin isIn={true} clockin={clockin}>
                                    <small className={`pointer mr-2 ${clockin.distance_in_miles > 0.2 ? "text-danger" : ""}`}>
                                        <i className="fas fa-map-marker-alt"></i> In

                                    </small>
                                </LatLongClockin>
                            }
                            {clockin.latitude_out > 0 &&
                                <LatLongClockin isIn={false} clockin={clockin}>
                                    <small className={`pointer ${clockin.distance_out_miles > 0.2 ? "text-danger" : ""}`}>
                                        <i className="fas fa-map-marker-alt"></i> Out
                                    </small>
                                </LatLongClockin>
                            }
                            {clockin.author != employee.user.profile.id ?
                                <Tooltip placement="bottom" trigger={['hover']} overlay={<small>Clocked in by a supervisor</small>}>
                                    <i className="fas fa-user-cog text-danger ml-2"></i>
                                </Tooltip>
                                : !moment(payment.created_at).isSame(moment(payment.updated_at)) && payment.status === "PENDING" ?
                                    <Tooltip placement="bottom" trigger={['hover']} overlay={<small>Previously updated by supervisor</small>}>
                                        <i className="fas fa-user-edit text-danger ml-2"></i>
                                    </Tooltip>
                                    :
                                    null
                            }
                        </div>}
                    </div>}
                </td>
        }
        <td className="time">
            {readOnly ?
                <p>{(approvedTimes.in !== undefined) && approvedTimes.in.format('LT')}</p>
                :
                <TimePicker
                    showSecond={false}
                    defaultValue={approvedTimes.in}
                    format={TIME_FORMAT}
                    onChange={(value) => {
                        if (value && value!==undefined) {
                            let ended_at = approvedTimes.out;
                            if (value.isAfter(ended_at)) ended_at = moment(ended_at).add(1, 'days');
                            if(value && value !== undefined) setApprovedTimes({ ...approvedTimes, in: value, out: ended_at });
                        }
                    }}
                    value={approvedTimes.in}
                    use12Hours
                />
            }
            <small>({shiftStartTime})</small>
        </td>
        <td className="time">
            {readOnly ?
                <p>{(approvedTimes.out !== undefined) && approvedTimes.out.format('LT')}</p>
                :
                <TimePicker
                    className={`${clockin.automatically_closed ? 'border border-danger' : ''}`}
                    showSecond={false}
                    defaultValue={approvedTimes.out}
                    format={TIME_FORMAT}
                    onChange={(d1) => {
                        if (d1) {
                            const starting = approvedTimes.in;
                            let ended_at = moment(clockin.started_at).set({ hour: d1.get('hour'), minute: d1.get('minute'), second: d1.get('second') });
                            if (starting.isAfter(ended_at)) ended_at = moment(ended_at).add(1, 'days');
                            if(ended_at && ended_at !== undefined) setApprovedTimes({ ...approvedTimes, out: ended_at });
                        }
                    }}
                    value={approvedTimes.out}
                    use12Hours
                />
            }
            <small>
                ({shiftEndTime})
            </small>
            {shiftNextDay &&
                <Tooltip placement="bottom" trigger={['hover']} overlay={<small>This shift ended on the next day</small>}>
                    <i className="fas fa-exclamation-triangle fa-xs mr-2"></i>
                </Tooltip>
            }
            {clockin.automatically_closed &&
                <Tooltip placement="bottom" trigger={['hover']} overlay={<small>Automatically clocked out</small>}>
                    <i className="fas fa-stopwatch text-danger fa-xs mr-2"></i>
                </Tooltip>
            }
        </td>
        <td style={{ minWidth: "75px", maxWidth: "75px" }}>
            <p className="mt-1" style={{ marginBottom: "7px" }}>{clockinHours}</p>
            <small className="d-block my-0">(Plan: {plannedHours})</small>
        </td>
        {readOnly ?
            <td>{payment.breaktime_minutes} min</td>
            :
            <td style={{ minWidth: "75px", maxWidth: "75px" }} className="text-center">
                {
                    <input type="number" className="w-100 rounded"
                        onChange={e => e.target.value != '' ? setBreaktime(Math.abs(parseInt(e.target.value))) : setBreaktime(0)} value={breaktime}
                    />
                }
                <small>minutes</small>
            </td>
        }
        <td>{clockInTotalHoursAfterBreak}</td>
        <td>{clockin.shift || !readOnly ? diff : "-"}</td>
        {readOnly ?
            <td className="text-center">
                {payment.status === "APPROVED" ? <span><i className="fas fa-check-circle"></i></span>
                    : payment.status === "REJECTED" ? <span><i className="fas fa-times-circle"></i></span>
                        : `${payment.status}<${readOnly ? "true" : "false"}`
                }
                {period.status === "OPEN" && (payment.status === "APPROVED" || payment.status === "REJECTED") &&
                    <i onClick={() => onUndo(payment)} className="fas fa-undo ml-2 pointer"></i>
                }
            </td>
            :
            <td className="text-center">
                <Button
                    color="success"
                    size="small"
                    icon="check"
                    onClick={(value) => {
                        if (payment.status === "NEW") {
                            if (shift.id === undefined) Notify.error("You need to specify a shift for all the new clockins");
                            else onApprove({
                                shift: shift,
                                employee: employee,
                                clockin: null,
                                breaktime_minutes: breaktime,
                                regular_hours: (plannedHours > clockInTotalHoursAfterBreak || plannedHours === 0) ? clockInTotalHoursAfterBreak : plannedHours,
                                over_time: diff < 0 ? 0 : diff,
                                //
                                approved_clockin_time: approvedTimes.in,
                                approved_clockout_time: approvedTimes.out
                            });
                        }
                        else onApprove({
                            breaktime_minutes: breaktime,
                            regular_hours: (plannedHours > clockInTotalHoursAfterBreak || plannedHours === 0) ? clockInTotalHoursAfterBreak : plannedHours,
                            over_time: diff < 0 ? 0 : diff,
                            shift:shift,
                            approved_clockin_time: approvedTimes.in,
                            approved_clockout_time: approvedTimes.out
                        });
                    }}
                />
                <Button
                    className="mt-1"
                    color="danger"
                    size="small"
                    icon={payment.status === "NEW" ? "trash" : "times"}
                    onClick={(value) => onReject({ status: "REJECTED" })}
                />
            </td>
        }
    </tr>;
};
PaymentRow.propTypes = {
    payment: PropTypes.object,
    period: PropTypes.object,
    employee: PropTypes.object,
    readOnly: PropTypes.bool,
    onApprove: PropTypes.func,
    onReject: PropTypes.func,
    onUndo: PropTypes.func,
    shifts: PropTypes.array,
    onChange: PropTypes.func,
    selection: PropTypes.object
};
PaymentRow.defaultProps = {
    shifts: [],
    period: null
};

/**
 * SelectTimesheet
 */

const filterClockins = (formChanges, formData, onChange) => {
    onChange(Object.assign(formChanges, { employees: [], loading: true }));

    const query = queryString.stringify({
        starting_at: formChanges.starting_at ? formChanges.starting_at.format('YYYY-MM-DD') : null,
        ending_at: formChanges.ending_at ? formChanges.ending_at.format('YYYY-MM-DD') : null,
        shift: formData.shift ? formData.shift.id || formData.shift.id : ''
    });
    search(ENTITIY_NAME, '?' + query).then((data) =>
        onChange({ employees: data, loading: false })
    );
};

export const SelectTimesheet = ({ catalog, formData, onChange, onSave, onCancel, history }) => {
    const { bar } = useContext(Theme.Context);
    const employer = store.getState('current_employer');
    const [noMorePeriods, setNoMorePeriods] = useState(false);
    const [periods, setPeriods] = useState(formData.periods);
    if (!employer || !employer.payroll_configured || !moment.isMoment(employer.payroll_period_starting_time)) {
        return <div className="text-center">
            <p>Please setup your payroll settings first.</p>
            <Button color="success" onClick={() => history.push("/payroll/settings")}>Setup Payroll Settings</Button>
        </div>;
    }
    if(!periods) return "Loading...";
    let note = null;
    if (periods && periods.length > 0) {
        const end = moment(periods[0].ending_at);
        end.add(7, 'days');
        if (end.isBefore(TODAY())) note = "Payroll was generated until " + end.format('M d');
    }
    return (<div>
        <div className="top-bar">
            <Button
                icon="sync" color="primary" size="small" rounded={true}
                onClick={() => processPendingPayrollPeriods().then(_periods => onChange({ periods: periods.concat(_periods) }))}
                note={note}
                notePosition="left"
            />
        </div>
        <div className="row mb-4">
            <div className="col-12">
                <h2 className="mt-1">Select a timesheet:</h2>
                <ul className="scroll" style={{ maxHeight: "600px", overflowY: "auto", padding: "10px", margin: "-10px" }}>
                    <div>
                        {periods.length === 0 && <p>No previous payroll periods have been found</p>}
                        {periods.map(p =>
                            <GenericCard key={p.id}
                                hover={true} className="pr-2"
                                onClick={() => history.push(`/payroll/period/${p.id}`)}
                            >
                                <div className="avatar text-center pt-1 bg-transparent">
                                    {p.status === "FINALIZED" ? <i className="fas fa-check-circle"></i>
                                        : p.status === "OPEN" ? <i className="far fa-circle"></i>
                                            : ''
                                    }
                                </div>
                                From {moment(p.starting_at).format('MMM DD, YYYY')} to {moment(p.ending_at).format('MMM DD, YYYY')}
                                <p className="my-0"><small className={`badge ${p.total_payments > 0 ? 'badge-secondary' : 'badge-info'}`}>{p.total_payments} Payments</small></p>
                            </GenericCard>
                        )}
                        {!noMorePeriods && Array.isArray(periods) && periods.length > 0 ? (
                            <div className="row text-center w-100 mt-3">
                                <div className="col">
                                    <Button onClick={() => {
                                        const PAGINATION_MONTHS_LENGTH = 1;
                                        searchMe(`payroll-periods`, `?end=${moment(periods[periods.length - 1]['ending_at']).subtract(1, 'weeks').format('YYYY-MM-DD')}&start=${moment(periods[periods.length - 1]['starting_at']).subtract(PAGINATION_MONTHS_LENGTH, 'months').format('YYYY-MM-DD')}`, formData.periods)
                                            .then((newPeriods) => {
                                                if (Array.isArray(newPeriods) && newPeriods.length > 0 && newPeriods.length > periods.length) {
                                                    setPeriods(newPeriods);
                                                } else setNoMorePeriods(true);
                                            });
                                    }}>Load More</Button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                </ul>
            </div>
        </div>


    </div >);
};
SelectTimesheet.propTypes = {
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    formData: PropTypes.object,
    catalog: PropTypes.object //contains the data needed for the form to load
};

export const SelectShiftPeriod = ({ catalog, formData, onChange, onSave, onCancel, history }) => {
    const { bar } = useContext(Theme.Context);

    let note = null;
    if (formData.periods.length > 0) {
        const end = moment(formData.periods[0].ending_at);
        end.add(7, 'days');
        if (end.isBefore(TODAY())) note = "Payroll was generated until " + end.format('MM dd');
    }
    return (<div>
        <div className="top-bar">
            <Button
                icon="sync" color="primary" size="small" rounded={true}
                onClick={() => null}
                note={note}
                notePosition="left"
            />

        </div>
        <div className="row">
            <div className="col-12">
                <div>
                    <h2 className="mt-1">Select a payment period:</h2>
                    <Select className="select-shifts" isMulti={false}
                        value={{
                            value: null,
                            label: `Select a payment period`
                        }}
                        defaultValue={{
                            value: null,
                            label: `Select a payment period`
                        }}
                        components={{ Option: ShiftOption, SingleValue: ShiftOption }}
                        onChange={(selectedOption) => searchMe("payment", `?period=${selectedOption.id}`).then((payments) => {
                            onChange({ selectedPayments: payments, selectedPeriod: selectedOption });
                            history.push(`/payroll/period/${selectedOption.id}`);
                        })}
                        options={[{
                            value: null,
                            label: `Select a payment period`
                        }].concat(formData.periods)}
                    />
                </div>
            </div>
            {(formData && typeof formData.selectedPayments != 'undefined' && formData.selectedPayments.length > 0) ?
                <div className="col-12 mt-3">
                    <ul>
                        {formData.selectedPayments.map((payment, i) => {
                            return (<EmployeeExtendedCard
                                key={i}
                                employee={payment.employee}
                                showFavlist={false}
                                showButtonsOnHover={false}
                                onClick={() => {
                                    bar.show({
                                        to: `/payroll/period/${formData.selectedPeriod.id}?` + queryString.stringify({
                                            talent_id: payment.employee.id
                                        })
                                    });
                                }}
                            >
                                {
                                    (payment.status === "PENDING") ?
                                        <span> pending <i className="fas fa-exclamation-triangle mr-2"></i></span>
                                        :
                                        (payment.status === "PAID") ?
                                            <span> unpaid <i className="fas fa-dollar-sign mr-2"></i></span>
                                            :
                                            <i className="fas fa-check-circle mr-2"></i>
                                }
                            </EmployeeExtendedCard>);
                        })}
                    </ul>
                </div>
                : (typeof formData.loading !== 'undefined' && formData.loading) ?
                    <div className="col-12 mt-3 text-center">Loading...</div>
                    :
                    <div className="col-12 mt-3 text-center">No talents found for this period or shift</div>
            }
        </div>
    </div>);
};
SelectShiftPeriod.propTypes = {
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    formData: PropTypes.object,
    catalog: PropTypes.object //contains the data needed for the form to load
};

export class PayrollRating extends Flux.DashView {

    constructor() {
        super();
        this.state = {
            ratings: [],
            employer: store.getState('current_employer'),
            payrollPeriods: [],
            payments: [],
            singlePayrollPeriod: null,
            reviews: []
        };
    }

    componentDidMount() {

        this.subscribe(store, 'current_employer', (employer) => {
            this.setState({ employer });
        });

        const payrollPeriods = store.getState('payroll-periods');
        this.subscribe(store, 'payroll-periods', (_payrollPeriods) => {
            this.updatePayrollPeriod(_payrollPeriods);
            //if(!this.state.singlePayrollPeriod) this.getSinglePeriod(this.props.match.params.period_id, payrollPeriods);
        });
        if (!payrollPeriods) {
            searchMe('payroll-periods');
        }
        else {
            this.updatePayrollPeriod(payrollPeriods);
            this.getSinglePeriod(this.props.match.params.period_id, payrollPeriods);

        }
        this.removeHistoryListener = this.props.history.listen((data) => {
            const period = /\/payroll\/period\/(\d+)/gm;
            const periodMatches = period.exec(data.pathname);
            // const search = /\?talent_id=(\d+)/gm;
            // const searchMatches = search.exec(data.search);
            if (periodMatches) this.getSinglePeriod(periodMatches[1]);
        });
        return () => {
            payrollPeriods.unsubscribe();
        };
    }

    defaultRatings(singlePeriod) {

        return new Promise((resolve, reject) => {

            if (!singlePeriod) resolve(null);
            const shiftList = singlePeriod.payments.map(s => s.shift.id).filter((v, i, s) => s.indexOf(v) === i).join(",");
            searchMe('ratings', '?shifts=' + shiftList)
                .then(previousRatings => {
                    let ratings = {};
                    singlePeriod.payments.forEach(pay => {
                        if (typeof ratings[pay.employee.id] === 'undefined') ratings[pay.employee.id] = { employee: pay.employee, shifts: [], rating: null, comments: '' };
                        const hasPreviousShift = previousRatings.find(r => (r.shift && pay.shift && r.shift.id === pay.shift.id && r.employee === pay.employee.id));
                        if (!hasPreviousShift && pay.shift) ratings[pay.employee.id].shifts.push(pay.shift.id);

                    });
                    resolve(Object.values(ratings));
                })
                .catch(error => Notify.error("There was an error fetching the ratings for the shift"));
        });
    }

    getSinglePeriod(periodId, payrollPeriods) {
        if (typeof periodId !== 'undefined') {
            if (!payrollPeriods) fetchSingle("payroll-periods", periodId);
            else {
                const singlePayrollPeriod = payrollPeriods.find(pp => pp.id == periodId);
                this.defaultRatings(singlePayrollPeriod)
                    .then(payments => this.setState({ singlePayrollPeriod, payments }));
            }
        }
    }

    updatePayrollPeriod(payrollPeriods) {

        if (payrollPeriods == null) return;

        let singlePayrollPeriod = null;
        if (typeof this.props.match.params.period_id !== 'undefined') {
            singlePayrollPeriod = payrollPeriods.find(pp => pp.id == this.props.match.params.period_id);
        }

        this.defaultRatings(singlePayrollPeriod)
            .then(payments => this.setState({ payrollPeriods, singlePayrollPeriod: singlePayrollPeriod || null, payments }));
    }


    render() {
        if (!this.state.employer) return "Loading...";
        else if (!this.state.employer.payroll_configured || !moment.isMoment(this.state.employer.payroll_period_starting_time)) {
            return <div className="p-1 listcontents text-center">
                <h3>Please setup your payroll settings first.</h3>
                <Button color="success" onClick={() => this.props.history.push("/payroll-settings")}>Setup Payroll Settings</Button>
            </div>;
        }

        return (<div className="p-1 listcontents mx-auto">
            {/* {this.state.singlePayrollPeriod && this.state.singlePayrollPeriod.status == "FINALIZED" &&
                <Redirect from={'/payroll/rating/' + this.state.singlePayrollPeriod.id} to={'/payroll/report/' + this.state.singlePayrollPeriod.id} />
            } */}
            <Theme.Consumer>
                {({ bar }) => (<span>
                    {(!this.state.singlePayrollPeriod) ? '' :
                        (this.state.singlePayrollPeriod.payments.length > 0) ?
                            <div>
                                <p className="text-center">
                                    <h2 className="mb-0">Please rate the talents for this period</h2>
                                    <h4 className="mt-0">{this.state.singlePayrollPeriod.label}</h4>
                                </p>
                            </div>
                            :
                            <p>No payments to review for this period</p>
                    }

                    {
                        this.state.payments.map((list, i) => {

                            if (Array.isArray(list.shifts) && list.shifts.length > 0) return (
                                <div className="row list-card" key={i} >

                                    <div className="col-1 my-auto">

                                        <Avatar url={list.employee.user.profile.picture} />
                                    </div>
                                    <div className="col-3 my-auto">

                                        <span>{list.employee.user.first_name + " " + list.employee.user.last_name}</span>
                                    </div>
                                    <div className="col my-auto">
                                        <StarRating
                                            onClick={(e) => {
                                                const allPayments = this.state.payments;
                                                allPayments[i].rating = e;
                                                this.setState({
                                                    allPayments
                                                });
                                            }
                                            }
                                            onHover={() => null}
                                            direction="right"
                                            fractions={2}
                                            quiet={false}
                                            readonly={false}
                                            totalSymbols={5}
                                            value={list.rating}
                                            placeholderValue={0}
                                            placeholderRating={Number(0)}
                                            emptySymbol="far fa-star md"
                                            fullSymbol="fas fa-star"
                                            placeholderSymbol={"fas fa-star"}
                                        />
                                    </div>
                                    <div className="col-6 my-auto">
                                        <TextareaAutosize style={{ width: '100%' }} placeholder="Any additional comments?" value={list.comments} onChange={(e) => {

                                            const allPayments = this.state.payments;
                                            allPayments[i].comments = e.target.value;
                                            this.setState({
                                                allPayments
                                            });
                                        }} />
                                    </div>

                                </div>);


                        })

                    }

                    <div className="btn-bar text-center mt-3">

                        <button type="button" className="btn btn-primary" onClick={() => {
                            const unrated = this.state.payments.find(p => p.rating == null && p.shifts.length > 0);
                            const rated = [].concat.apply([], this.state.payments.filter(s => s.shifts.length > 0).map(p => {
                                if (p.shifts.length > 1) {
                                    return p.shifts.map(s => ({
                                        employee: p.employee.id,
                                        shift: s,
                                        rating: p.rating,
                                        comments: p.comments,
                                        payment: p.id
                                    }));
                                } else {
                                    return (
                                        [{
                                            employee: p.employee.id,
                                            shift: p.shifts[0],
                                            rating: p.rating,
                                            comments: p.comments,
                                            payment: p.id
                                        }]
                                    );
                                }
                            }));
                            if (unrated) Notify.error("There are still some employees that need to be rated");
                            else {
                                create('ratings', rated).then((res) => { if (res) update('payroll-periods', Object.assign(this.state.singlePayrollPeriod, { status: 'FINALIZED' })); })
                                    .then((resp) => { this.props.history.push('/payroll/report/' + this.state.singlePayrollPeriod.id); })
                                    .catch(e => Notify.error(e.message || e));
                            }

                        }}>Finalize Period</button>

                    </div>

                </span>)}
            </Theme.Consumer>
        </div >);
    }
}
export class PayrollReport extends Flux.DashView {

    constructor() {
        super();
        this.state = {
            employer: store.getState('current_employer'),
            payrollPeriods: [],
            payments: [],
            paymentInfo: [],
            singlePayrollPeriod: null,
        };
    }

    componentDidMount() {

        this.subscribe(store, 'current_employer', (employer) => {
            this.setState({ employer });
        });
        this.subscribe(store, 'payroll-period-payments', (paymentInfo) => {
            this.setState({ paymentInfo });
        });
        this.subscribe(store, 'employee-payment', () => {
            fetchPeyrollPeriodPayments(this.state.singlePayrollPeriod.id);
        });
        const payrollPeriods = store.getState('payroll-periods');
        this.subscribe(store, 'payroll-periods', (_payrollPeriods) => {
            //Updated payroll.
        });
        if (!payrollPeriods) {
            searchMe('payroll-periods');
        }
        else {
            this.updatePayrollPeriod(payrollPeriods);
            this.getSinglePeriod(this.props.match.params.period_id, payrollPeriods);

        }

        this.removeHistoryListener = this.props.history.listen((data) => {
            const period = /\/payroll\/period\/(\d+)/gm;
            const periodMatches = period.exec(data.pathname);
            // const search = /\?talent_id=(\d+)/gm;
            // const searchMatches = search.exec(data.search);
            if (periodMatches) this.getSinglePeriod(periodMatches[1]);
        });
    }

    groupPayments(singlePeriod) {
        if (!singlePeriod) return null;

        let groupedPayments = {};
        if(singlePeriod.payments){
            singlePeriod.payments.forEach(pay => {
                if (typeof groupedPayments[pay.employee.id] === 'undefined') {
                    groupedPayments[pay.employee.id] = { employee: pay.employee, payments: [] };
                }
                groupedPayments[pay.employee.id].payments.push(pay);
            });
        }

        return Object.values(groupedPayments);
    }

    getSinglePeriod(periodId, payrollPeriods) {
        if (typeof periodId !== 'undefined') {
            if (!payrollPeriods) fetchSingle("payroll-periods", periodId);
            else {
                const singlePayrollPeriod = payrollPeriods.find(pp => pp.id == periodId);
                this.setState({ singlePayrollPeriod, payments: this.groupPayments(singlePayrollPeriod) }, () => {
                    fetchPeyrollPeriodPayments(this.state.singlePayrollPeriod.id);
                });
            }
        }
    }

    updatePayrollPeriod(payrollPeriods) {

        if (payrollPeriods == null) return;

        let singlePayrollPeriod = null;
        if (typeof this.props.match.params.period_id !== 'undefined') {
            singlePayrollPeriod = payrollPeriods.find(pp => pp.id == this.props.match.params.period_id);
        }

        this.setState({ payrollPeriods, singlePayrollPeriod: singlePayrollPeriod || null, payments: this.groupPayments(singlePayrollPeriod) });
    }


    render() {
        if (!this.state.employer) return "Loading...";
        else if (!this.state.employer.payroll_configured || !moment.isMoment(this.state.employer.payroll_period_starting_time)) {
            return <div className="p-1 listcontents text-center">
                <h3>Please setup your payroll settings first.</h3>
                <Button color="success" onClick={() => this.props.history.push("/payroll/settings")}>Setup Payroll Settings</Button>
            </div>;
        }
        //const allowLevels = (window.location.search != '');
        return (<div className="p-1 listcontents">
            <Theme.Consumer>
                {({ bar }) => (<span>
                    {(!this.state.paymentInfo) ? '' :
                        (this.state.paymentInfo.payments && this.state.paymentInfo.payments.length > 0) ?
                            <div>
                                <p className="text-right">
                                    <h2>Payments for {this.state.singlePayrollPeriod.label}</h2>
                                </p>
                                <div className="row mb-4 text-right">
                                    <div className="col text-left">
                                        <Button size="small" onClick={() => {
                                            // res => this.props.history.push('/payroll/period/' + period.id
                                        const period =this.state.singlePayrollPeriod;
                                        update('payroll-periods', Object.assign(period, { status: 'OPEN' })).then(res => this.props.history.push('/payroll/period/' + period.id))
                                        .catch(e => Notify.error(e.message || e));
                                        }}>Undo Period
                                        </Button>
                                    </div>

                                    <div className="col">

                                        <Button size="small" onClick={() => this.props.history.push('/payroll/period/' + this.state.singlePayrollPeriod.id)}>Review Timesheet</Button>
                                    </div>
                                    <PDFDownloadLink document={() => <PayrollPeriodReport employer={this.state.empoyer} payments={this.state.payments} period={this.state.singlePayrollPeriod}/>} fileName={"JobCore " + this.state.singlePayrollPeriod.label + ".pdf"}>
                                        {({ blob, url, loading, error }) => (loading ? 'Loading...' : (
                                            <div className="col">
                                                <Button color="success" size="small" >Export to PDF</Button>
                                            </div>
                                        )
                                        )}
                                    </PDFDownloadLink>


                                </div>

                                {/* {this.state.singlePayrollPeriod.status == "OPEN" &&
                                    <Redirect from={'/payroll/report/' + this.state.singlePayrollPeriod.id} to={'/payroll/rating/' + this.state.singlePayrollPeriod.id} />
                                } */}
                                <table className="table table-striped payroll-summary">
                                    <thead>
                                        <tr>
                                            <th scope="col">Staff</th>
                                            <th scope="col">Regular Hrs</th>
                                            <th scope="col">Over Time</th>
                                            <th scope="col">Earnings</th>
                                            <th scope="col">Taxes</th>
                                            <th scope="col">Amount</th>
                                            <th scope="col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.paymentInfo.payments.sort((a, b) =>
                                            a.employee.last_name.toLowerCase() > b.employee.last_name.toLowerCase() ? 1 : -1
                                        ).map(pay => {
                                            // const total = pay.filter(p => p.status === 'APPROVED').reduce((incoming, current) => {
                                            //     return {
                                            //         over_time: parseFloat(current.over_time) + parseFloat(incoming.over_time),
                                            //         regular_hours: parseFloat(current.regular_hours) + parseFloat(incoming.regular_hours),
                                            //         total_amount: parseFloat(current.total_amount) + parseFloat(incoming.total_amount),
                                            //         status: current.status == 'PAID' && incoming.status == 'PAID' ? 'PAID' : 'UNPAID'
                                            //     };
                                            // }, { regular_hours: 0, total_amount: 0, over_time: 0, status: 'UNPAID' });
                                            return <tr key={pay.employee.id}>
                                                <td>
                                                    {pay.employee.last_name}, {pay.employee.first_name}
                                                    <p className="m-0 p-0"><span className="badge">{pay.paid ? "paid" : "unpaid"}</span></p>
                                                </td>
                                                <td>{pay.regular_hours}</td>
                                                <td>{pay.over_time}</td>
                                                <td>{pay.earnings}</td> 
                                                <td>{pay.deductions}</td>
                                                <td>{pay.amount}</td>
                                                <td>
                                                    <Button 
                                                    color="success" 
                                                    size="small" 
                                                    onClick={() => bar.show({ 
                                                        slug: "make_payment", 
                                                        data: {
                                                            pay: pay,
                                                            paymentInfo: this.state.paymentInfo,
                                                            periodId: this.state.singlePayrollPeriod.id,
                                                            bar: bar
                                                    } 
                                                    })}>
                                                        {pay.paid ? "Payment details" : "Make payment"}
                                                    </Button>
                                                </td>
                                                {/* <td>{Math.round((total.regular_hours + total.over_time) * 100) / 100}</td>
                                                <td>${Math.round(total.total_amount * 100) / 100}</td> */}
                                            </tr>;
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            :
                            <p>No payments to review for this period</p>
                    }
                </span>)}
            </Theme.Consumer>
        </div >);
    }
}

